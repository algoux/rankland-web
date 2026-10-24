import { ErrCode } from '@common/enums/err-code.enum';
import { ContestStatus } from '@common/modules/contest/contest-status';
import { rankland_live_contest_client, rankland_live_contest_common } from '@common/proto/rankland_live_contest';
import { isTrustedResponse, TrustedResponse } from '@server/http/trusted-response';
import { parseProducerBatchJson } from '../contest-event-codec';
import ContestEventReadCache from '../contest-event-read-cache';
import { InMemoryContestEventStore } from '../contest-event-store.memory';
import ContestEventStreamService from '../contest-event-stream.service';
import { getContestVisibility } from '../contest-event-visibility';

const request = { uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1, compactProgress: false };

describe('contest finalized event visibility', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([undefined, ContestStatus.Created])('preserves numeric Created visibility for status %j', async (status) => {
    const store = new InMemoryContestEventStore();
    store.addContest(request.uk, {
      status,
      contest: { duration: [5, 'h'], frozenDuration: [1, 'h'] },
    });
    const visibility = {
      frozenStartNs: '14400000000000',
      visibilityFingerprint: `duration=18000;frozen=3600;status=${ContestStatus.Created}`,
    };
    expect(getContestVisibility(18_000, 3_600, status)).toEqual(visibility);
    await expect(store.readAuthorityByUk(request.uk)).resolves.toMatchObject(visibility);
    await expect(store.runInStreamTransaction(request.uk, async (transaction) => transaction.stream.status))
      .resolves.toBe(ContestStatus.Created);
    await expect(new ContestEventStreamService(store).appendProducerEvents({
      uk: request.uk,
      producerId: 'producer-a',
      batch: parseProducerBatchJson({ streamRevision: 1, events: [newSolution()] }),
    })).resolves.toMatchObject({ acceptedEventIds: [1], lastEventId: 1 });
  });

  it.each(['off', 'shadow', 'on'] as const)(
    'isolates privileged reads from the public cache in %s mode for both transports',
    async (mode) => {
      const { store, cache } = await fixture();
      const service = new ContestEventStreamService(store, cache, { mode });
      const cacheRead = vi.spyOn(cache, 'getEvents');
      for (const format of ['json', 'protobuf'] as const) {
        expect(eventIds(await service.getClientEventsForTransport(request, format))).toEqual([1]);
        const previousCacheReads = cacheRead.mock.calls.length;
        const privileged = await service.getClientEventsForTransport({ ...request, ignoreFrozen: true }, format);
        expect(isTrustedResponse(privileged)).toBe(false);
        expect(eventIds(privileged)).toEqual([1, 2, 3, 4]);
        expect(cacheRead).toHaveBeenCalledTimes(previousCacheReads);
        expect(eventIds(await service.getClientEventsForTransport(request, format))).toEqual([1]);
      }
    },
  );

  it('retains raw event checkpoints and compaction while bypassing freeze filtering', async () => {
    const { store } = await fixture();
    const service = new ContestEventStreamService(store);
    const firstPage = await service.getClientEvents({ ...request, limit: 2, ignoreFrozen: true });
    expect(firstPage.events.map((event) => event.eventId)).toEqual([1, 2]);
    expect(firstPage).toMatchObject({ checkpointEventId: 2, latestEventId: 4, hasMore: true });
    const compact = await service.getClientEvents({ ...request, compactProgress: true, ignoreFrozen: true });
    expect(compact.events.map((event) => event.eventId)).toEqual([1, 3, 4]);
    expect(compact).toMatchObject({ checkpointEventId: 4, streamRevision: 1, resetRequired: false });
  });

  it.each(['json', 'protobuf'] as const)(
    'rebuilds an existing public %s snapshot after finalization without changing revision',
    async (format) => {
      const { store, cache } = await fixture();
      const service = new ContestEventStreamService(store, cache, { mode: 'on' });
      expect(eventIds(await service.getClientEventsForTransport(request, format))).toEqual([1]);
      store.setContestStatus(request.uk, ContestStatus.Finalized);
      cache.invalidate({
        type: 'metadata',
        contestId: '101',
        canonicalUk: request.uk,
        visibilityFingerprint: getContestVisibility(18_000, 3_600, ContestStatus.Finalized).visibilityFingerprint,
      });
      const replay = await service.getClientEventsForTransport(request, format);
      expect(eventIds(replay)).toEqual([1, 2, 3, 4]);
      await expect(service.getStreamState(request.uk)).resolves.toEqual({
        contestId: '101', uk: request.uk, lastEventId: 4, streamRevision: 1, producerId: 'producer-a',
      });
      const existingCursor = await service.getClientEvents({ ...request, afterEventId: 4 });
      expect(existingCursor).toMatchObject({ events: [], checkpointEventId: 4, resetRequired: false, streamRevision: 1 });
    },
  );

  it('recovers finalized visibility after a missed metadata control via authority expiry', async () => {
    let now = 0;
    const { store, cache } = await fixture({ now: () => now, authorityLeaseMs: 10 });
    const service = new ContestEventStreamService(store, cache, { mode: 'on' });
    expect(eventIds(await service.getClientEventsForTransport(request, 'json'))).toEqual([1]);
    store.setContestStatus(request.uk, ContestStatus.Finalized);
    now = 11;
    expect(eventIds(await service.getClientEventsForTransport(request, 'json'))).toEqual([1, 2, 3, 4]);
  });

  it('reveals finalized events through the uncached snapshot path and rejects all further producer writes', async () => {
    const { store, producerBatch } = await fixture();
    const service = new ContestEventStreamService(store);
    store.setContestStatus(request.uk, ContestStatus.Finalized);
    expect((await service.getClientEvents(request)).events.map((event) => event.eventId)).toEqual([1, 2, 3, 4]);
    await expect(service.appendProducerEvents({
      uk: request.uk, producerId: 'producer-a', batch: producerBatch,
    })).rejects.toMatchObject({ code: ErrCode.ContestFinalized });
    await expect(service.appendProducerEvents({
      uk: request.uk, producerId: 'producer-b', batch: producerBatch,
    })).rejects.toMatchObject({ code: ErrCode.ContestFinalized });
    expect((await store.getStreamState(request.uk)).lastEventId).toBe(4);
  });

  it('rejects a finalized empty stream before acquiring its producer lock', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest(request.uk, { status: ContestStatus.Finalized });
    const service = new ContestEventStreamService(store);
    await expect(service.appendProducerEvents({
      uk: request.uk,
      producerId: 'producer-a',
      batch: parseProducerBatchJson({ streamRevision: 1, events: [newSolution()] }),
    })).rejects.toMatchObject({ code: ErrCode.ContestFinalized });
    await expect(service.getStreamState(request.uk)).resolves.toMatchObject({ lastEventId: 0, producerId: null });
    expect(await service.getStreamState(request.uk)).not.toHaveProperty('status');
  });
});

async function fixture(options: { now?: () => number; authorityLeaseMs?: number } = {}) {
  const store = new InMemoryContestEventStore();
  store.addContest(request.uk, {
    contestId: '101',
    contest: { duration: [5, 'h'], frozenDuration: [1, 'h'] },
  });
  const producerBatch = parseProducerBatchJson({
    streamRevision: 1,
    events: [
      newSolution(),
      {
        eventId: 2,
        type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
        solutionOnProgressData: { solutionId: 1, percentageProgress: 50 },
      },
      {
        eventId: 3,
        type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE,
        solutionOnResultSettleData: {
          solutionId: 1, result: rankland_live_contest_common.Result.WA,
          time: { value: 14_401, unit: rankland_live_contest_common.TimeUnit.S },
        },
      },
      {
        eventId: 4,
        type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE,
        solutionOnResultChangeData: {
          solutionId: 1, previousResult: rankland_live_contest_common.Result.WA,
          result: rankland_live_contest_common.Result.AC,
          time: { value: 14_402, unit: rankland_live_contest_common.TimeUnit.S },
        },
      },
    ],
  });
  await new ContestEventStreamService(store).appendProducerEvents({
    uk: request.uk, producerId: 'producer-a', batch: producerBatch,
  });
  const cache = new ContestEventReadCache(store, {
    maxBytes: 1024 * 1024, maxEntryBytes: 1024 * 1024, ...options,
  });
  return { store, cache, producerBatch };
}

function newSolution() {
  return {
    eventId: 1,
    type: rankland_live_contest_common.EventType.NEW_SOLUTION,
    newSolutionData: {
      solutionId: 1, userId: 'u1', problemAlias: 'A',
      time: { value: 14_400, unit: rankland_live_contest_common.TimeUnit.S },
    },
  };
}

function eventIds(response: Record<string, any> | TrustedResponse): number[] {
  if (!isTrustedResponse(response)) return response.events.map((event: any) => event.eventId);
  try {
    const data = response.kind === 'pre-normalized-json'
      ? response.data as { events: { eventId: number }[] }
      : rankland_live_contest_client.GetContestEventsResponse.decode(response.body);
    return (data.events ?? []).map((event) => event.eventId as number);
  } finally {
    response.release();
  }
}
