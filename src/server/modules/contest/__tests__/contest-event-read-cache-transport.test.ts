import { rankland_live_contest_common } from '@common/proto/rankland_live_contest';
import { isTrustedResponse } from '@server/http/trusted-response';
import ContestEventReadCache from '../contest-event-read-cache';
import { parseProducerBatchJson } from '../contest-event-codec';
import { InMemoryContestEventStore } from '../contest-event-store.memory';
import ContestEventStreamService from '../contest-event-stream.service';
import { ContestEventReadDatabaseDeadlineError } from '../contest-event-read-db-deadline';

const request = {
  uk: 'Contest-A',
  afterEventId: 0,
  limit: 10,
  streamRevision: 1,
  compactProgress: false,
};

describe('contest event read cache transport seam', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps off on the legacy response and does not compare trusted on-mode results by default', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('Contest-A', { contestId: '101' });
    const legacyRead = vi.spyOn(store, 'readEventsSnapshot');
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const writer = new ContestEventStreamService(store);
    await writer.appendProducerEvents({
      uk: 'Contest-A',
      producerId: 'producer-a',
      batch: parseProducerBatchJson({
        streamRevision: 1,
        events: [
          {
            eventId: 1,
            type: rankland_live_contest_common.EventType.NEW_SOLUTION,
            newSolutionData: {
              solutionId: 1,
              userId: 'u1',
              problemAlias: 'A',
              time: { value: 1, unit: rankland_live_contest_common.TimeUnit.S },
            },
          },
        ],
      }),
    });
    const cache = new ContestEventReadCache(store, { maxBytes: 1024 * 1024, maxEntryBytes: 1024 * 1024 });
    const offService = new ContestEventStreamService(store, cache, { mode: 'off' } as any);
    const onService = new ContestEventStreamService(store, cache, { mode: 'on' } as any);

    const off = await offService.getClientEventsForTransport(request, 'json');
    expect(legacyRead).toHaveBeenCalledTimes(1);
    const on = await onService.getClientEventsForTransport(request, 'json');

    expect(isTrustedResponse(off)).toBe(false);
    expect((off as any).events[0]).toMatchObject({ eventId: 1, type: 'NEW_SOLUTION' });
    expect(isTrustedResponse(on)).toBe(true);
    if (!isTrustedResponse(on) || on.kind !== 'pre-normalized-json') {
      throw new Error('expected trusted JSON response');
    }
    expect((on.data as any).events[0]).toMatchObject({ eventId: 1, type: 'NEW_SOLUTION' });
    on.release();
    await Promise.resolve();
    expect(legacyRead).toHaveBeenCalledTimes(1);
    expect(cache.snapshotCounters().comparisons).toBe(0);
  });

  it('bounds legacy fallback concurrency and rejects a full queue with Retry-After', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('Contest-A', { contestId: '101' });
    let releaseRead!: () => void;
    let markStarted!: () => void;
    const readStarted = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    const readGate = new Promise<void>((resolve) => {
      releaseRead = resolve;
    });
    const originalRead = store.readEventsSnapshot.bind(store);
    vi.spyOn(store, 'readEventsSnapshot').mockImplementation(async (input) => {
      markStarted();
      await readGate;
      return originalRead(input);
    });
    const service = new ContestEventStreamService(store, undefined, {
      mode: 'off',
      fallbackConcurrency: 1,
      fallbackQueueSize: 0,
      fallbackQueueTimeoutMs: 1_000,
      retryAfterSeconds: 1,
    });

    const first = service.getClientEventsForTransport(request, 'json');
    await readStarted;
    await expect(service.getClientEventsForTransport(request, 'json')).rejects.toMatchObject({
      code: 503,
      headers: { 'Retry-After': '1' },
    });
    releaseRead();
    await expect(first).resolves.toMatchObject({ uk: 'Contest-A' });
  });

  it('maps an end-to-end legacy database read deadline to 503 with Retry-After', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('Contest-A', { contestId: '101' });
    vi.spyOn(store, 'readEventsSnapshot').mockRejectedValue(new ContestEventReadDatabaseDeadlineError(1_000));
    const service = new ContestEventStreamService(store, undefined, {
      mode: 'off',
      fallbackConcurrency: 4,
      fallbackQueueSize: 32,
      fallbackQueueTimeoutMs: 1_000,
      retryAfterSeconds: 1,
    });

    await expect(service.getClientEventsForTransport(request, 'json')).rejects.toMatchObject({
      code: 503,
      headers: { 'Retry-After': '1' },
    });
  });

  it('compares shadow protobuf semantics without changing the legacy response', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('Contest-A', { contestId: '101' });
    const cache = new ContestEventReadCache(store, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
    });
    const service = new ContestEventStreamService(store, cache, {
      mode: 'shadow',
      fallbackConcurrency: 4,
      fallbackQueueSize: 32,
      fallbackQueueTimeoutMs: 1_000,
      retryAfterSeconds: 1,
      onCompareSampleRate: 0,
    });

    const response = await service.getClientEventsForTransport(request, 'protobuf');

    expect(isTrustedResponse(response)).toBe(false);
    await vi.waitFor(() => {
      expect(cache.snapshotCounters()).toMatchObject({ comparisons: 1, comparisonMismatches: 0 });
    });
  });

  it('compares an on-mode response against the same event fence when an append races the sample', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('Contest-A', { contestId: '101' });
    const writer = new ContestEventStreamService(store);
    await writer.appendProducerEvents({
      uk: 'Contest-A',
      producerId: 'producer-a',
      batch: parseProducerBatchJson({
        streamRevision: 1,
        events: [
          {
            eventId: 1,
            type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
            contestConfigChangeData: { changedFields: [] },
          },
        ],
      }),
    });
    const cache = new ContestEventReadCache(store, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
    });
    const originalRead = store.readEventsSnapshot.bind(store);
    let appendedDuringComparison = false;
    vi.spyOn(store, 'readEventsSnapshot').mockImplementation(async (input) => {
      if (!appendedDuringComparison) {
        appendedDuringComparison = true;
        await writer.appendProducerEvents({
          uk: 'Contest-A',
          producerId: 'producer-a',
          batch: parseProducerBatchJson({
            streamRevision: 1,
            events: [
              {
                eventId: 2,
                type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
                contestConfigChangeData: { changedFields: [] },
              },
            ],
          }),
        });
      }
      return originalRead(input);
    });
    const service = new ContestEventStreamService(store, cache, {
      mode: 'on',
      fallbackConcurrency: 4,
      fallbackQueueSize: 32,
      fallbackQueueTimeoutMs: 1_000,
      retryAfterSeconds: 1,
      onCompareSampleRate: 1,
    });

    const response = await service.getClientEventsForTransport(request, 'json');
    if (!isTrustedResponse(response)) {
      throw new Error('expected trusted JSON response');
    }
    response.release();

    await vi.waitFor(() => {
      expect(cache.snapshotCounters()).toMatchObject({
        comparisons: 1,
        comparisonMismatches: 0,
        residentContests: 1,
      });
    });
    expect(store.readEventsSnapshot).toHaveBeenCalledWith(expect.objectContaining({ throughEventId: 1 }));
  });

  it('still fails closed when the fenced legacy projection truly differs', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('Contest-A', { contestId: '101' });
    const writer = new ContestEventStreamService(store);
    await writer.appendProducerEvents({
      uk: 'Contest-A',
      producerId: 'producer-a',
      batch: parseProducerBatchJson({
        streamRevision: 1,
        events: [
          {
            eventId: 1,
            type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
            contestConfigChangeData: { changedFields: [] },
          },
        ],
      }),
    });
    const cache = new ContestEventReadCache(store, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
    });
    const originalRead = store.readEventsSnapshot.bind(store);
    vi.spyOn(store, 'readEventsSnapshot').mockImplementation(async (input) => ({
      ...(await originalRead(input)),
      events: [],
    }));
    const service = new ContestEventStreamService(store, cache, {
      mode: 'on',
      fallbackConcurrency: 4,
      fallbackQueueSize: 32,
      fallbackQueueTimeoutMs: 1_000,
      retryAfterSeconds: 1,
      onCompareSampleRate: 1,
    });

    const response = await service.getClientEventsForTransport(request, 'json');
    if (!isTrustedResponse(response)) {
      throw new Error('expected trusted JSON response');
    }
    response.release();

    await vi.waitFor(() => {
      expect(cache.snapshotCounters()).toMatchObject({
        comparisons: 1,
        comparisonMismatches: 1,
        residentContests: 0,
      });
    });
  });

  it('fails closed without reporting a semantic mismatch when authority changes during comparison', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('Contest-A', { contestId: '101' });
    const writer = new ContestEventStreamService(store);
    await writer.appendProducerEvents({
      uk: 'Contest-A',
      producerId: 'producer-a',
      batch: parseProducerBatchJson({
        streamRevision: 1,
        events: [
          {
            eventId: 1,
            type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
            contestConfigChangeData: { changedFields: [] },
          },
        ],
      }),
    });
    const cache = new ContestEventReadCache(store, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
    });
    const originalRead = store.readEventsSnapshot.bind(store);
    vi.spyOn(store, 'readEventsSnapshot').mockImplementation(async (input) => {
      const snapshot = await originalRead(input);
      return {
        ...snapshot,
        stream: { ...snapshot.stream, streamRevision: 2, lastEventId: 0 },
        events: [],
        settledEventIdsBySolutionId: new Map(),
      };
    });
    const service = new ContestEventStreamService(store, cache, {
      mode: 'on',
      fallbackConcurrency: 4,
      fallbackQueueSize: 32,
      fallbackQueueTimeoutMs: 1_000,
      retryAfterSeconds: 1,
      onCompareSampleRate: 1,
    });

    const response = await service.getClientEventsForTransport(request, 'json');
    if (!isTrustedResponse(response)) {
      throw new Error('expected trusted JSON response');
    }
    response.release();

    await vi.waitFor(() => {
      expect(cache.snapshotCounters()).toMatchObject({
        comparisons: 1,
        comparisonMismatches: 0,
        comparisonInconclusive: 1,
        residentContests: 0,
      });
    });
  });

  it('returns bounded 503 when an expired authority lease cannot refresh', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('Contest-A', { contestId: '101' });
    const writer = new ContestEventStreamService(store);
    await writer.appendProducerEvents({
      uk: 'Contest-A',
      producerId: 'producer-a',
      batch: parseProducerBatchJson({
        streamRevision: 1,
        events: [
          {
            eventId: 1,
            type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
            contestConfigChangeData: { changedFields: [] },
          },
        ],
      }),
    });
    let now = 0;
    const cache = new ContestEventReadCache(store, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
      authorityLeaseMs: 6_000,
      now: () => now,
    });
    const warm = await cache.getEvents(request, 'json');
    warm.release();
    now = 7_000;
    vi.spyOn(store, 'readAuthorityByUk').mockRejectedValue(new Error('database unavailable'));
    const service = new ContestEventStreamService(store, cache, {
      mode: 'on',
      fallbackConcurrency: 4,
      fallbackQueueSize: 32,
      fallbackQueueTimeoutMs: 1_000,
      retryAfterSeconds: 1,
      onCompareSampleRate: 0,
    });

    await expect(service.getClientEventsForTransport(request, 'json')).rejects.toMatchObject({
      code: 503,
      headers: { 'Retry-After': '1' },
    });
  });

  it('routes an oversize negative marker through the bounded legacy path without rehydrating', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('Contest-A', { contestId: '101' });
    const writer = new ContestEventStreamService(store);
    await writer.appendProducerEvents({
      uk: 'Contest-A',
      producerId: 'producer-a',
      batch: parseProducerBatchJson({
        streamRevision: 1,
        events: [
          {
            eventId: 1,
            type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
            contestConfigChangeData: { changedFields: [] },
          },
        ],
      }),
    });
    const rangeEstimate = vi.spyOn(store, 'estimateEventRangeMemory');
    const rangeRead = vi.spyOn(store, 'readEventRange');
    const cache = new ContestEventReadCache(store, { maxBytes: 1, maxEntryBytes: 1 });
    const service = new ContestEventStreamService(store, cache, {
      mode: 'on',
      fallbackConcurrency: 1,
      fallbackQueueSize: 1,
      fallbackQueueTimeoutMs: 1_000,
      retryAfterSeconds: 1,
      onCompareSampleRate: 0,
    });

    const first = await service.getClientEventsForTransport(request, 'json');
    const second = await service.getClientEventsForTransport(request, 'json');

    expect(isTrustedResponse(first)).toBe(false);
    expect(isTrustedResponse(second)).toBe(false);
    expect((first as any).events).toHaveLength(1);
    expect(rangeEstimate).toHaveBeenCalledTimes(1);
    expect(rangeRead).not.toHaveBeenCalled();
    expect(cache.snapshotCounters().oversizeMarkers).toBe(1);
  });
});
