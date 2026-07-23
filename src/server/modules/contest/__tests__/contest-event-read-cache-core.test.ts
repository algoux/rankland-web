import { rankland_live_contest_client, rankland_live_contest_common } from '@common/proto/rankland_live_contest';
import {
  eventToStoredEventInput,
  getContestEventsResponseToJson,
  parseProducerBatchJson,
} from '../contest-event-codec';
import { ContestEventRangeMemoryEstimate, ContestReadableEvent } from '../contest-event-store';
import ContestEventReadCache, {
  ContestEventAuthorityState,
  ContestEventReadCacheLoader,
  ContestEventRangeRead,
} from '../contest-event-read-cache';
import {
  buildContestEventCacheSnapshot,
  estimateContestEventSnapshotBuildUpperBoundBytes,
  estimateContestReadableEventsBufferedBytes,
} from '../contest-event-read-cache-core';
import { InMemoryContestEventStore } from '../contest-event-store.memory';
import ContestEventStreamService from '../contest-event-stream.service';
import { ErrCode } from '@common/enums/err-code.enum';

function readableEvent(event: any, solutionSubmitTimeNs?: string): ContestReadableEvent {
  const stored = eventToStoredEventInput(event, 'producer-a');
  return {
    contestId: '101',
    streamRevision: 1,
    eventId: stored.eventId,
    type: stored.type,
    solutionId: stored.solutionId,
    solutionSubmitTimeNs: solutionSubmitTimeNs ?? stored.solutionSubmitTimeNs,
    payloadBytes: stored.payloadBytes,
  };
}

function projectionRebuildInitialEvents(): ContestReadableEvent[] {
  return [
    readableEvent({
      eventId: 1,
      type: rankland_live_contest_common.EventType.NEW_SOLUTION,
      newSolutionData: {
        solutionId: 7,
        userId: 'u7',
        problemAlias: 'A',
        time: { value: 1, unit: rankland_live_contest_common.TimeUnit.S },
      },
    }),
    readableEvent({
      eventId: 2,
      type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
      solutionOnProgressData: { solutionId: 7, percentageProgress: 25 },
    }),
    readableEvent({
      eventId: 3,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    }),
    readableEvent({
      eventId: 4,
      type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
      solutionOnProgressData: { solutionId: 7, percentageProgress: 75 },
    }),
  ];
}

describe('contest event read cache snapshot', () => {
  it('accounts pending progress event-id slots in snapshot metadata', () => {
    const events = [25, 75].map((percentageProgress, index) =>
      readableEvent({
        eventId: index + 1,
        type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
        solutionOnProgressData: { solutionId: 7, percentageProgress },
      }),
    );
    const snapshot = buildContestEventCacheSnapshot({
      contestId: '101',
      streamRevision: 1,
      targetLastEventId: events.length,
      chunkEventCount: 8,
      events,
    });

    expect(snapshot.memoryParts()[0].estimatedBytes).toBe(Buffer.byteLength('101') + 96 + 2 * 8);
  });

  it('bounds every unique allocation before rebuilding a partial tail and compact projection', () => {
    const initial = projectionRebuildInitialEvents();
    const snapshot = buildContestEventCacheSnapshot({
      contestId: '101',
      streamRevision: 1,
      targetLastEventId: initial.length,
      chunkEventCount: 3,
      events: initial,
    });
    const settle = readableEvent({
      eventId: 5,
      type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE,
      solutionOnResultSettleData: {
        solutionId: 7,
        result: rankland_live_contest_common.Result.AC,
        time: { value: 2, unit: rankland_live_contest_common.TimeUnit.S },
      },
    });
    const upperBound = snapshot.appendAllocationUpperBoundBytes([settle]);
    const appended = snapshot.appendCommitted([settle], 32);
    if (appended.status !== 'appended') throw new Error('expected appended snapshot');
    const baseParts = new Set(snapshot.memoryParts().map((part) => part.identity));
    const uniqueBytes = appended.snapshot
      .memoryParts()
      .filter((part) => !baseParts.has(part.identity))
      .reduce((total, part) => total + part.estimatedBytes, 0);

    expect(uniqueBytes).toBeLessThanOrEqual(upperBound);
  });

  it('keeps the schema-calibrated cold-build bound above every event representation', () => {
    const events = [
      ...projectionRebuildInitialEvents(),
      readableEvent({
        eventId: 5,
        type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE,
        solutionOnResultSettleData: {
          solutionId: 7,
          result: rankland_live_contest_common.Result.AC,
          time: { value: 2, unit: rankland_live_contest_common.TimeUnit.S },
        },
      }),
      readableEvent({
        eventId: 6,
        type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE,
        solutionOnResultChangeData: {
          solutionId: 7,
          previousResult: rankland_live_contest_common.Result.WA,
          result: rankland_live_contest_common.Result.AC,
          time: { value: 3, unit: rankland_live_contest_common.TimeUnit.S },
        },
      }),
    ];
    const snapshot = buildContestEventCacheSnapshot({
      contestId: '101',
      streamRevision: 1,
      targetLastEventId: events.length,
      chunkEventCount: 3,
      events,
    });

    expect(snapshot.estimatedBytes).toBeLessThanOrEqual(
      estimateContestEventSnapshotBuildUpperBoundBytes('101', events, 3),
    );
  });

  it('keeps raw checkpoint paging while selecting a precomputed compact projection', async () => {
    const events = [
      readableEvent({
        eventId: 1,
        type: rankland_live_contest_common.EventType.NEW_SOLUTION,
        newSolutionData: {
          solutionId: 7,
          userId: 'u7',
          problemAlias: 'A',
          time: { value: 10, unit: rankland_live_contest_common.TimeUnit.S },
        },
      }),
      readableEvent({
        eventId: 2,
        type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
        solutionOnProgressData: { solutionId: 7, percentageProgress: 20 },
      }),
      readableEvent({
        eventId: 3,
        type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
        solutionOnProgressData: { solutionId: 7, percentageProgress: 80 },
      }),
      readableEvent({
        eventId: 4,
        type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE,
        solutionOnResultSettleData: {
          solutionId: 7,
          result: rankland_live_contest_common.Result.AC,
          time: { value: 20, unit: rankland_live_contest_common.TimeUnit.S },
        },
      }),
    ];
    const loader = new ScriptedLoader(events);
    const cache = new ContestEventReadCache(loader, {
      chunkEventCount: 2,
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
    });

    const fullResult = await cache.getEvents(
      { uk: 'Contest-A', afterEventId: 0, limit: 3, streamRevision: 1, compactProgress: false },
      'json',
    );
    const compactResult = await cache.getEvents(
      { uk: 'Contest-A', afterEventId: 0, limit: 3, streamRevision: 1, compactProgress: true },
      'json',
    );
    expect(fullResult.format).toBe('json');
    expect(compactResult.format).toBe('json');
    if (fullResult.format !== 'json' || compactResult.format !== 'json') {
      throw new Error('expected JSON cache results');
    }
    const full = fullResult.data;
    const compact = compactResult.data;

    expect(full.events.map((event) => event.eventId)).toEqual([1, 2, 3]);
    expect(compact.events.map((event) => event.eventId)).toEqual([1]);
    expect(compact).toMatchObject({
      checkpointEventId: 3,
      latestEventId: 4,
      streamRevision: 1,
      hasMore: true,
      resetRequired: false,
    });
    expect(loader.rangeReadCount).toBe(1);
  });

  it('materializes frozen JSON wire views and protobuf fragments once per generation', async () => {
    const frozenStartNs = String(4 * 60 * 60 * 1_000_000_000);
    const beforeFreezeNs = String(60 * 60 * 1_000_000_000);
    const loader = new ScriptedLoader(
      [
        readableEvent({
          eventId: 1,
          type: rankland_live_contest_common.EventType.NEW_SOLUTION,
          newSolutionData: {
            solutionId: 1,
            userId: 'frozen',
            problemAlias: 'A',
            time: { value: frozenStartNs, unit: rankland_live_contest_common.TimeUnit.NS },
          },
        }),
        readableEvent(
          {
            eventId: 2,
            type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
            solutionOnProgressData: { solutionId: 1, percentageProgress: 50 },
          },
          frozenStartNs,
        ),
        readableEvent({
          eventId: 3,
          type: rankland_live_contest_common.EventType.NEW_SOLUTION,
          newSolutionData: {
            solutionId: 2,
            userId: 'visible',
            problemAlias: 'B',
            time: { value: beforeFreezeNs, unit: rankland_live_contest_common.TimeUnit.NS },
          },
        }),
        readableEvent(
          {
            eventId: 4,
            type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE,
            solutionOnResultSettleData: {
              solutionId: 2,
              result: rankland_live_contest_common.Result.AC,
              time: { value: frozenStartNs, unit: rankland_live_contest_common.TimeUnit.NS },
            },
          },
          beforeFreezeNs,
        ),
        readableEvent({
          eventId: 5,
          type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
          contestConfigChangeData: { changedFields: [] },
        }),
      ],
      { lastEventId: 5, frozenStartNs, visibilityFingerprint: `frozen=${frozenStartNs}` },
    );
    const cache = new ContestEventReadCache(loader, { maxBytes: 1024 * 1024, maxEntryBytes: 1024 * 1024 });

    const jsonResult = await cache.getEvents(
      { uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1, compactProgress: false },
      'json',
    );
    const protobufResult = await cache.getEvents(
      { uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1, compactProgress: false },
      'protobuf',
    );
    if (jsonResult.format !== 'json' || protobufResult.format !== 'protobuf') {
      throw new Error('unexpected cache format');
    }
    const decoded = rankland_live_contest_client.GetContestEventsResponse.decode(protobufResult.body);
    const protobufJson = rankland_live_contest_client.GetContestEventsResponse.toObject(decoded, {
      longs: String,
      enums: String,
      arrays: true,
    }) as any;

    expect(jsonResult.data.events.map((event) => event.eventId)).toEqual([1, 3, 4, 5]);
    expect(jsonResult.data.events[3]).toMatchObject({
      type: 'CONTEST_CONFIG_CHANGE',
      contestConfigChangeData: { changedFields: [] },
    });
    expect(protobufJson.events).toEqual(jsonResult.data.events);
    expect((jsonResult.data.events[0].newSolutionData as any).time).toEqual({
      value: frozenStartNs,
      unit: 'NS',
    });
    expect(cache.snapshotCounters().canonicalizedEvents).toBe(5);
    expect(loader.rangeReadCount).toBe(1);
    jsonResult.release();
  });

  it('guards a no-progress tip with MySQL authority and catches up a missed watermark', async () => {
    const initialEvents = [
      readableEvent({
        eventId: 1,
        type: rankland_live_contest_common.EventType.NEW_SOLUTION,
        newSolutionData: {
          solutionId: 1,
          userId: 'u1',
          problemAlias: 'A',
          time: { value: 1, unit: rankland_live_contest_common.TimeUnit.S },
        },
      }),
    ];
    const loader = new ScriptedLoader(initialEvents);
    const cache = new ContestEventReadCache(loader, { maxBytes: 1024 * 1024, maxEntryBytes: 1024 * 1024 });
    const warm = await cache.getEvents(
      { uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1, compactProgress: false },
      'json',
    );
    warm.release();

    loader.appendEvent(
      readableEvent({
        eventId: 2,
        type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
        contestConfigChangeData: { changedFields: [] },
      }),
    );
    const caughtUp = await cache.getEvents(
      { uk: 'Contest-A', afterEventId: 1, limit: 10, streamRevision: 1, compactProgress: false },
      'json',
    );
    if (caughtUp.format !== 'json') {
      throw new Error('expected JSON cache result');
    }

    expect(caughtUp.data.events.map((event) => event.eventId)).toEqual([2]);
    expect(caughtUp.data).toMatchObject({ checkpointEventId: 2, latestEventId: 2, hasMore: false });
    expect(loader.authorityByUkReadCount).toBe(2);
    expect(loader.rangeReads.at(-1)).toMatchObject({ afterEventId: 1, throughEventId: 2 });
    expect(cache.snapshotCounters().canonicalizedEvents).toBe(2);
    caughtUp.release();
  });

  it('uses a short generation-scoped cooldown after an authority read failure', async () => {
    let now = 0;
    const loader = new ScriptedLoader([]);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
      authorityLeaseMs: 10,
      failureCooldownMs: 100,
      now: () => now,
    });
    const warm = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    warm.release();
    now = 20;
    vi.spyOn(loader, 'readAuthorityByUk').mockRejectedValue(new Error('database unavailable'));

    await expect(
      cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json'),
    ).rejects.toThrow(/authority refresh failed/i);
    const readsAfterFailure = loader.authorityByUkReadCount;
    await expect(
      cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json'),
    ).rejects.toThrow(/cooldown/i);
    expect(loader.authorityByUkReadCount).toBe(readsAfterFailure);
    expect(cache.snapshotCounters().failureCooldownRejects).toBe(1);
  });

  it('keeps ahead revision and cursor evidence request-local until MySQL confirms it', async () => {
    const loader = new ScriptedLoader([
      readableEvent({
        eventId: 1,
        type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
        contestConfigChangeData: { changedFields: [] },
      }),
    ]);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
    });

    await expect(
      cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 2 }, 'json'),
    ).rejects.toThrow(/temporarily unavailable/i);
    const ahead = await cache.getEvents(
      { uk: 'Contest-A', afterEventId: 999_999, limit: 10, streamRevision: 1 },
      'json',
    );
    if (ahead.format !== 'json') throw new Error('expected JSON result');
    expect(ahead.data).toMatchObject({
      resetRequired: true,
      resetReason: 'afterEventId is ahead of latestEventId',
      latestEventId: 1,
    });
    const normal = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    if (normal.format !== 'json') throw new Error('expected JSON result');
    expect(normal.data).toMatchObject({ latestEventId: 1, checkpointEventId: 1, resetRequired: false });
    normal.release();
  });

  it('does not let a late identity read resurrect a delete tombstone', async () => {
    const loader = new DeferredAuthorityLoader([
      readableEvent({
        eventId: 1,
        type: rankland_live_contest_common.EventType.NEW_SOLUTION,
        newSolutionData: {
          solutionId: 1,
          userId: 'u1',
          problemAlias: 'A',
          time: { value: 1, unit: rankland_live_contest_common.TimeUnit.S },
        },
      }),
    ]);
    const cache = new ContestEventReadCache(loader, { maxBytes: 1024 * 1024, maxEntryBytes: 1024 * 1024 });
    const pending = cache.getEvents(
      { uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1, compactProgress: false },
      'json',
    );
    await loader.authorityStarted;

    cache.invalidate({ type: 'delete', contestId: '101', canonicalUk: 'Contest-A' });
    loader.releaseAuthority();

    await expect(pending).rejects.toMatchObject({ code: ErrCode.ContestNotFound });
    expect(cache.snapshotCounters().residentContests).toBe(0);
  });

  it('does not let metadata control race with an absent identity entry', async () => {
    const loader = new DeferredAuthorityLoader([
      readableEvent({
        eventId: 1,
        type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
        contestConfigChangeData: { changedFields: [] },
      }),
    ]);
    const cache = new ContestEventReadCache(loader, { maxBytes: 1024 * 1024, maxEntryBytes: 1024 * 1024 });
    const pending = cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    await loader.authorityStarted;

    cache.invalidate({
      type: 'metadata',
      contestId: '101',
      canonicalUk: 'Contest-A',
      visibilityFingerprint: 'duration=18000;frozen=3600',
    });
    loader.releaseAuthority();

    await expect(pending).rejects.toThrow(/generation|control|temporarily unavailable/i);
    expect(cache.snapshotCounters().residentContests).toBe(0);
  });

  it('does not publish an identity or hydrate after disposal begins', async () => {
    const loader = new DeferredAuthorityLoader([
      readableEvent({
        eventId: 1,
        type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
        contestConfigChangeData: { changedFields: [] },
      }),
    ]);
    const cache = new ContestEventReadCache(loader, { maxBytes: 1024 * 1024, maxEntryBytes: 1024 * 1024 });
    const pending = cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    await loader.authorityStarted;

    cache.dispose();
    loader.releaseAuthority();

    await expect(pending).rejects.toThrow(/draining|generation|temporarily unavailable/i);
    expect(loader.rangeReadCount).toBe(0);
    expect(cache.getActiveContestIds()).toEqual([]);
    expect(cache.snapshotCounters()).toMatchObject({ residentContests: 0, builderReservedBytes: 0 });
  });

  it('returns the normal not-found domain error for a tombstoned contest', async () => {
    const loader = new ScriptedLoader([]);
    const cache = new ContestEventReadCache(loader, { maxBytes: 1024 * 1024, maxEntryBytes: 1024 * 1024 });

    cache.invalidate({ type: 'delete', contestId: '101', canonicalUk: 'Contest-A' });

    await expect(
      cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json'),
    ).rejects.toMatchObject({ code: ErrCode.ContestNotFound });
  });

  it('materializes an observed same-revision watermark before the following GET', async () => {
    const first = readableEvent({
      eventId: 1,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    const loader = new ScriptedLoader([first]);
    const cache = new ContestEventReadCache(loader, { maxBytes: 1024 * 1024, maxEntryBytes: 1024 * 1024 });
    const warm = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    warm.release();
    const second = readableEvent({
      eventId: 2,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    loader.appendEvent(second);
    const watermark = {
      contestId: '101',
      canonicalUk: 'Contest-A',
      latestEventId: 2,
      streamRevision: 1,
    };
    cache.observeWatermark(watermark);

    await expect(cache.materializeObservedWatermark(watermark)).resolves.toBe(true);
    const beforeGet = cache.snapshotCounters();
    const result = await cache.getEvents(
      { uk: 'Contest-A', afterEventId: 1, limit: 10, streamRevision: 1, compactProgress: false },
      'json',
    );
    if (result.format !== 'json') throw new Error('expected JSON result');

    expect(result.data.events.map((event) => event.eventId)).toEqual([2]);
    expect(cache.snapshotCounters()).toMatchObject({
      coldMisses: beforeGet.coldMisses,
      readyHits: beforeGet.readyHits + 1,
      eagerTailFillStarted: 1,
      eagerTailFillCompleted: 1,
      eagerTailFillFailed: 0,
    });
    result.release();
  });

  it('coalesces consecutive eager tail-fill requests into one hydration', async () => {
    const first = readableEvent({
      eventId: 1,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    const loader = new TailDeferredLoader([first]);
    const cache = new ContestEventReadCache(loader, { maxBytes: 1024 * 1024, maxEntryBytes: 1024 * 1024 });
    const warm = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    warm.release();
    loader.appendEvent(
      readableEvent({
        eventId: 2,
        type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
        contestConfigChangeData: { changedFields: [] },
      }),
    );
    loader.armTailBlock();
    const watermark = {
      contestId: '101',
      canonicalUk: 'Contest-A',
      latestEventId: 2,
      streamRevision: 1,
    };
    cache.observeWatermark(watermark);

    const firstFill = cache.materializeObservedWatermark(watermark);
    await loader.tailStarted;
    const joinedFill = cache.materializeObservedWatermark(watermark);
    loader.releaseTail();

    await expect(Promise.all([firstFill, joinedFill])).resolves.toEqual([true, true]);
    expect(loader.rangeReadCount).toBe(2);
    expect(cache.snapshotCounters()).toMatchObject({
      eagerTailFillStarted: 1,
      eagerTailFillJoined: 1,
      eagerTailFillCompleted: 2,
      eagerTailFillFailed: 0,
    });
  });

  it('does not create an entry when eager tail-fill observes an uncached contest', async () => {
    const loader = new ScriptedLoader([]);
    const cache = new ContestEventReadCache(loader, { maxBytes: 1024 * 1024, maxEntryBytes: 1024 * 1024 });

    await expect(
      cache.materializeObservedWatermark({
        contestId: '101',
        canonicalUk: 'Contest-A',
        latestEventId: 1,
        streamRevision: 1,
      }),
    ).resolves.toBe(false);

    expect(loader.authorityByUkReadCount).toBe(0);
    expect(cache.getActiveContestIds()).toEqual([]);
    expect(cache.snapshotCounters().eagerTailFillSkipped).toBe(1);
  });

  it('emits runtime cache gauges separately from non-negative counter deltas', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const cache = new ContestEventReadCache(
      new ScriptedLoader([
        readableEvent({
          eventId: 1,
          type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
          contestConfigChangeData: { changedFields: [] },
        }),
      ]),
      { maxBytes: 1024 * 1024, maxEntryBytes: 1024 * 1024 },
    );
    const warm = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    warm.release();
    cache.start();
    cache.invalidate({
      type: 'metadata',
      contestId: '101',
      canonicalUk: 'Contest-A',
      visibilityFingerprint: 'duration=18000;frozen=3600',
    });

    (cache as any).logSummary(false);

    const runtime = info.mock.calls
      .filter(([event]) => event === 'contest_event_read_runtime.summary')
      .map(([, payload]) => JSON.parse(String(payload)))
      .at(-1);
    expect(runtime.interval).toEqual({
      startEpochMs: expect.any(Number),
      endEpochMs: expect.any(Number),
    });
    expect(runtime.interval.endEpochMs).toBeGreaterThanOrEqual(runtime.interval.startEpochMs);
    expect(Date.parse(runtime.capturedAt)).toBe(runtime.interval.endEpochMs);
    expect(runtime.cache.gauges).toMatchObject({ residentContests: 0, residentEvents: 0, residentBytes: 0 });
    expect(runtime.cache.delta).not.toHaveProperty('residentContests');
    expect(runtime.cache.delta).not.toHaveProperty('hydrating');
    expect(Object.values(runtime.cache.delta).every((value) => typeof value === 'number' && value >= 0)).toBe(true);
    expect(
      Object.values(runtime.nodeMemory).every(
        (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0,
      ),
    ).toBe(true);
    expect(runtime.nodeMemory.heapTotalBytes).toBeGreaterThanOrEqual(runtime.nodeMemory.heapUsedBytes);
    expect(runtime.nodeMemory.v8HeapSizeLimitBytes).toBeGreaterThan(0);
    expect(runtime.nodeMemory).toMatchObject({
      rssBytes: expect.any(Number),
      externalBytes: expect.any(Number),
      arrayBuffersBytes: expect.any(Number),
      oldSpaceUsedBytes: expect.any(Number),
      newSpaceUsedBytes: expect.any(Number),
      largeObjectSpaceUsedBytes: expect.any(Number),
    });
    cache.dispose();
    info.mockRestore();
  });

  it('requires MySQL confirmation before materializing a higher revision watermark', async () => {
    const loader = new ScriptedLoader([
      readableEvent({
        eventId: 1,
        type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
        contestConfigChangeData: { changedFields: [] },
      }),
    ]);
    const cache = new ContestEventReadCache(loader, { maxBytes: 1024 * 1024, maxEntryBytes: 1024 * 1024 });
    const warm = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    warm.release();
    const watermark = {
      contestId: '101',
      canonicalUk: 'Contest-A',
      latestEventId: 0,
      streamRevision: 2,
    };
    cache.observeWatermark(watermark);

    await expect(cache.materializeObservedWatermark(watermark)).rejects.toThrow(/not confirmed by MySQL/i);
    await expect(
      cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json'),
    ).rejects.toThrow(/not confirmed|pending watermark/i);
    loader.setAuthority({ streamRevision: 2, lastEventId: 0 });
    await expect(cache.materializeObservedWatermark(watermark)).resolves.toBe(true);

    const current = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 2 }, 'json');
    if (current.format !== 'json') throw new Error('expected JSON result');
    expect(current.data).toMatchObject({ streamRevision: 2, latestEventId: 0, events: [] });
    expect(cache.snapshotCounters()).toMatchObject({ eagerTailFillCompleted: 1, eagerTailFillFailed: 1 });
    current.release();
  });

  it('does not publish an old hydration after a higher reset revision arrives', async () => {
    const loader = new DeferredHydrationLoader([
      readableEvent({
        eventId: 1,
        type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
        contestConfigChangeData: { changedFields: [] },
      }),
    ]);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
    });
    const oldRead = cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    await loader.rangeStarted;

    cache.observeWatermark({
      contestId: '101',
      canonicalUk: 'Contest-A',
      latestEventId: 0,
      streamRevision: 2,
    });
    loader.setAuthority({ streamRevision: 2, lastEventId: 0 });
    loader.releaseRange();

    await expect(oldRead).rejects.toThrow(/generation changed|temporarily unavailable/i);
    const current = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 2 }, 'json');
    if (current.format !== 'json') throw new Error('expected JSON result');
    expect(current.data).toMatchObject({ streamRevision: 2, latestEventId: 0, events: [] });
    current.release();
  });

  it('does not publish an in-flight hydration after a delete control', async () => {
    const loader = new DeferredHydrationLoader([
      readableEvent({
        eventId: 1,
        type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
        contestConfigChangeData: { changedFields: [] },
      }),
    ]);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
    });
    const pending = cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    await loader.rangeStarted;

    cache.invalidate({ type: 'delete', contestId: '101', canonicalUk: 'Contest-A' });
    loader.releaseRange();

    await expect(pending).rejects.toThrow(/generation changed|temporarily unavailable/i);
    expect(cache.snapshotCounters()).toMatchObject({ residentContests: 0, generationDiscards: 1 });
    await expect(
      cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json'),
    ).rejects.toMatchObject({ code: ErrCode.ContestNotFound });
  });

  it('does not publish an in-flight hydration after a visibility fingerprint control', async () => {
    const loader = new DeferredHydrationLoader([
      readableEvent({
        eventId: 1,
        type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
        contestConfigChangeData: { changedFields: [] },
      }),
    ]);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
    });
    const pending = cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    await loader.rangeStarted;
    const visibilityFingerprint = 'duration=18000;frozen=3600';

    cache.invalidate({
      type: 'metadata',
      contestId: '101',
      canonicalUk: 'Contest-A',
      visibilityFingerprint,
    });
    loader.setAuthority({ visibilityFingerprint, frozenStartNs: '3600000000000' });
    loader.releaseRange();

    await expect(pending).rejects.toThrow(/generation changed|temporarily unavailable/i);
    expect(cache.snapshotCounters()).toMatchObject({ residentContests: 0, generationDiscards: 1 });
    const current = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    if (current.format !== 'json') throw new Error('expected JSON result');
    expect(current.data).toMatchObject({ latestEventId: 1, resetRequired: false });
    current.release();
  });

  it('keeps invalidated response bytes accounted until the JSON lease releases', async () => {
    const loader = new ScriptedLoader([
      readableEvent({
        eventId: 1,
        type: rankland_live_contest_common.EventType.NEW_SOLUTION,
        newSolutionData: {
          solutionId: 1,
          userId: 'u1',
          problemAlias: 'A',
          time: { value: 1, unit: rankland_live_contest_common.TimeUnit.S },
        },
      }),
    ]);
    const cache = new ContestEventReadCache(loader, { maxBytes: 1024 * 1024, maxEntryBytes: 1024 * 1024 });
    const lease = await cache.getEvents(
      { uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1, compactProgress: false },
      'json',
    );
    if (lease.format !== 'json') {
      throw new Error('expected JSON cache result');
    }
    const before = cache.snapshotCounters();

    cache.invalidate({
      type: 'metadata',
      contestId: '101',
      canonicalUk: 'Contest-A',
      visibilityFingerprint: 'duration=18000;frozen=null',
    });
    const retired = cache.snapshotCounters();

    expect(retired.residentBytes).toBe(0);
    expect(retired.retiredPinnedBytes).toBe(before.residentBytes);
    expect(retired.totalAccountedBytes).toBe(before.totalAccountedBytes);
    lease.release();
    lease.release();
    expect(cache.snapshotCounters()).toMatchObject({
      retiredPinnedBytes: 0,
      totalAccountedBytes: 0,
    });
  });

  it('enforces the per-contest budget across retired pins and a replacement builder', async () => {
    const event = readableEvent({
      eventId: 1,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    const probe = new ContestEventReadCache(new ScriptedLoader([event]), {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
    });
    const probeResult = await probe.getEvents(
      { uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 },
      'json',
    );
    probeResult.release();
    const snapshotBytes = probe.snapshotCounters().residentBytes;
    const initialBuildBytes = probe.snapshotCounters().highWaterAccountedBytes;
    probe.dispose();

    const loader = new ScriptedLoader([event]);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: initialBuildBytes + snapshotBytes * 2,
      maxEntryBytes: initialBuildBytes,
    });
    const pinned = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    cache.invalidate({
      type: 'metadata',
      contestId: '101',
      canonicalUk: 'Contest-A',
      visibilityFingerprint: 'duration=18000;frozen=3600',
    });

    await expect(
      cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json'),
    ).rejects.toThrow(/contest is oversize|budget is exhausted/i);
    expect(cache.snapshotCounters()).toMatchObject({ residentContests: 0, retiredPinnedBytes: snapshotBytes });
    expect(cache.snapshotCounters().totalAccountedBytes).toBeLessThanOrEqual(initialBuildBytes);
    pinned.release();
  });

  it('counts shared snapshot parts once across pinned append generations', async () => {
    const initial = Array.from({ length: 64 }, (_, index) =>
      readableEvent({
        eventId: index + 1,
        type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
        contestConfigChangeData: { changedFields: [] },
      }),
    );
    const probe = new ContestEventReadCache(new ScriptedLoader(initial), {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
      chunkEventCount: 8,
    });
    const probeResult = await probe.getEvents(
      { uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 },
      'json',
    );
    probeResult.release();
    const snapshotBytes = probe.snapshotCounters().residentBytes;
    const initialBuildBytes = probe.snapshotCounters().highWaterAccountedBytes;
    probe.dispose();

    const loader = new ScriptedLoader(initial);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: snapshotBytes * 4,
      maxEntryBytes: snapshotBytes * 4,
      chunkEventCount: 8,
    });
    const leases = [await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json')];

    for (let eventId = 65; eventId <= 80; eventId += 1) {
      const event = readableEvent({
        eventId,
        type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
        contestConfigChangeData: { changedFields: [] },
      });
      loader.appendEvent(event);
      cache.observeCommittedAppend({
        contestId: '101',
        canonicalUk: 'Contest-A',
        streamRevision: 1,
        lastEventId: eventId,
        events: [event],
      });
      leases.push(
        await cache.getEvents({ uk: 'Contest-A', afterEventId: eventId - 1, limit: 10, streamRevision: 1 }, 'json'),
      );
    }

    const pinned = cache.snapshotCounters();
    expect(pinned.retiredPinnedBytes).toBeLessThan(pinned.residentBytes);
    expect(pinned.totalAccountedBytes).toBeLessThanOrEqual(snapshotBytes * 4);
    leases.forEach((lease) => lease.release());
    expect(cache.snapshotCounters()).toMatchObject({
      retiredPinnedBytes: 0,
      totalAccountedBytes: cache.snapshotCounters().residentBytes,
    });
  });

  it('reserves only incremental allocations when appending to a large resident snapshot', async () => {
    const initial = Array.from({ length: 64 }, (_, index) =>
      readableEvent({
        eventId: index + 1,
        type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
        contestConfigChangeData: { changedFields: [] },
      }),
    );
    const probe = new ContestEventReadCache(new ScriptedLoader(initial), {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
      chunkEventCount: 8,
    });
    const probeResult = await probe.getEvents(
      { uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 },
      'json',
    );
    probeResult.release();
    const initialBuildBytes = probe.snapshotCounters().highWaterAccountedBytes;
    probe.dispose();

    const loader = new ScriptedLoader(initial);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: initialBuildBytes * 2,
      maxEntryBytes: initialBuildBytes,
      chunkEventCount: 8,
    });
    const warm = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    warm.release();
    const event = readableEvent({
      eventId: 65,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    loader.appendEvent(event);
    cache.observeCommittedAppend({
      contestId: '101',
      canonicalUk: 'Contest-A',
      streamRevision: 1,
      lastEventId: 65,
      events: [event],
    });

    expect(cache.snapshotCounters()).toMatchObject({ residentEvents: 65, writeThroughDeferred: 0 });
  });

  it('rejects a pinned partial-tail append before materializing outside the entry budget', async () => {
    const first = readableEvent({
      eventId: 1,
      type: rankland_live_contest_common.EventType.NEW_SOLUTION,
      newSolutionData: {
        solutionId: 1,
        userId: 'u'.repeat(16 * 1024),
        problemAlias: 'A',
        time: { value: 1, unit: rankland_live_contest_common.TimeUnit.S },
      },
    });
    const probe = new ContestEventReadCache(new ScriptedLoader([first]), {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
      chunkEventCount: 8,
    });
    const probeResult = await probe.getEvents(
      { uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 },
      'json',
    );
    probeResult.release();
    const baseBytes = probe.snapshotCounters().residentBytes;
    const initialBuildBytes = probe.snapshotCounters().highWaterAccountedBytes;
    probe.dispose();

    const loader = new ScriptedLoader([first]);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: initialBuildBytes + baseBytes * 2,
      maxEntryBytes: initialBuildBytes,
      chunkEventCount: 8,
    });
    const pinned = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    const before = cache.snapshotCounters();
    const second = readableEvent({
      eventId: 2,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    loader.appendEvent(second);

    cache.observeCommittedAppend({
      contestId: '101',
      canonicalUk: 'Contest-A',
      streamRevision: 1,
      lastEventId: 2,
      events: [second],
    });

    expect(cache.snapshotCounters()).toMatchObject({
      residentEvents: 1,
      canonicalizedEvents: before.canonicalizedEvents,
      writeThroughDeferred: before.writeThroughDeferred + 1,
      builderReservedBytes: 0,
    });
    pinned.release();
  });

  it('hard-disables a contest after post-commit cache isolation fails', async () => {
    const cache = new ContestEventReadCache(new ScriptedLoader([]), {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
    });
    cache.disableContest('101');

    await expect(
      cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json'),
    ).rejects.toThrow(/disabled|temporarily unavailable/i);
  });

  it('discards a calibration snapshot captured before a metadata control', async () => {
    const loader = new ScriptedLoader([
      readableEvent({
        eventId: 1,
        type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
        contestConfigChangeData: { changedFields: [] },
      }),
    ]);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
    });
    const warm = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    warm.release();
    const calibration = cache.beginCalibration(['101']);

    cache.invalidate({
      type: 'metadata',
      contestId: '101',
      canonicalUk: 'Contest-A',
      visibilityFingerprint: 'duration=18000;frozen=3600',
    });
    cache.calibrate(
      [
        {
          contestId: '101',
          canonicalUk: 'Contest-A',
          streamRevision: 1,
          lastEventId: 1,
          frozenStartNs: null,
          visibilityFingerprint: 'duration=18000;frozen=null',
        },
      ],
      calibration,
    );

    expect(cache.snapshotCounters()).toMatchObject({ residentContests: 0, generationDiscards: 1 });
  });

  it('ignores a calibration result made stale by a same-revision target advance', async () => {
    const first = readableEvent({
      eventId: 1,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    const loader = new ScriptedLoader([first]);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
    });
    const warm = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    warm.release();
    const calibration = cache.beginCalibration(['101']);
    const second = readableEvent({
      eventId: 2,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    loader.appendEvent(second);
    cache.observeCommittedAppend({
      contestId: '101',
      canonicalUk: 'Contest-A',
      streamRevision: 1,
      lastEventId: 2,
      events: [second],
    });

    cache.calibrate(
      [
        {
          contestId: '101',
          canonicalUk: 'Contest-A',
          streamRevision: 1,
          lastEventId: 1,
          frozenStartNs: null,
          visibilityFingerprint: 'duration=18000;frozen=null',
        },
      ],
      calibration,
    );
    const current = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    if (current.format !== 'json') throw new Error('expected JSON result');

    expect(current.data.latestEventId).toBe(2);
    expect(current.data.events.map((event) => event.eventId)).toEqual([1, 2]);
    expect(cache.snapshotCounters()).toMatchObject({
      residentContests: 1,
      authorityResultsStaleByTargetAdvance: 1,
      generationDiscards: 0,
    });
    current.release();
  });

  it('still fails closed for a stable same-revision authority regression', async () => {
    const events = [1, 2].map((eventId) =>
      readableEvent({
        eventId,
        type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
        contestConfigChangeData: { changedFields: [] },
      }),
    );
    const loader = new ScriptedLoader(events);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
    });
    const warm = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    warm.release();
    const calibration = cache.beginCalibration(['101']);

    cache.calibrate(
      [
        {
          contestId: '101',
          canonicalUk: 'Contest-A',
          streamRevision: 1,
          lastEventId: 1,
          frozenStartNs: null,
          visibilityFingerprint: 'duration=18000;frozen=null',
        },
      ],
      calibration,
    );

    expect(cache.snapshotCounters()).toMatchObject({
      residentContests: 0,
      authorityResultsStaleByTargetAdvance: 0,
    });
  });

  it('write-throughs a continuous committed append without another event range read', async () => {
    const first = readableEvent({
      eventId: 1,
      type: rankland_live_contest_common.EventType.NEW_SOLUTION,
      newSolutionData: {
        solutionId: 1,
        userId: 'u1',
        problemAlias: 'A',
        time: { value: 1, unit: rankland_live_contest_common.TimeUnit.S },
      },
    });
    const loader = new ScriptedLoader([first]);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
      chunkEventCount: 2,
    });
    const warm = await cache.getEvents(
      { uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1, compactProgress: false },
      'json',
    );
    warm.release();
    const second = readableEvent({
      eventId: 2,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    loader.appendEvent(second);

    cache.observeCommittedAppend({
      contestId: '101',
      canonicalUk: 'Contest-A',
      streamRevision: 1,
      lastEventId: 2,
      events: [second],
    });
    const result = await cache.getEvents(
      { uk: 'Contest-A', afterEventId: 1, limit: 10, streamRevision: 1, compactProgress: false },
      'json',
    );
    if (result.format !== 'json') throw new Error('expected JSON result');

    expect(result.data.events.map((event) => event.eventId)).toEqual([2]);
    expect(loader.rangeReadCount).toBe(1);
    expect(cache.snapshotCounters().canonicalizedEvents).toBe(2);
    result.release();
  });

  it('atomically write-throughs a settle that removes pending progress across chunks', async () => {
    const initial = [
      readableEvent({
        eventId: 1,
        type: rankland_live_contest_common.EventType.NEW_SOLUTION,
        newSolutionData: {
          solutionId: 7,
          userId: 'u7',
          problemAlias: 'A',
          time: { value: 1, unit: rankland_live_contest_common.TimeUnit.S },
        },
      }),
      readableEvent({
        eventId: 2,
        type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
        solutionOnProgressData: { solutionId: 7, percentageProgress: 25 },
      }),
    ];
    const loader = new ScriptedLoader(initial);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
      chunkEventCount: 2,
    });
    const warm = await cache.getEvents(
      { uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1, compactProgress: true },
      'json',
    );
    warm.release();
    const delta = [
      readableEvent({
        eventId: 3,
        type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
        solutionOnProgressData: { solutionId: 7, percentageProgress: 75 },
      }),
      readableEvent({
        eventId: 4,
        type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE,
        solutionOnResultSettleData: {
          solutionId: 7,
          result: rankland_live_contest_common.Result.AC,
          time: { value: 2, unit: rankland_live_contest_common.TimeUnit.S },
        },
      }),
    ];
    delta.forEach((event) => loader.appendEvent(event));

    cache.observeCommittedAppend({
      contestId: '101',
      canonicalUk: 'Contest-A',
      streamRevision: 1,
      lastEventId: 4,
      events: delta,
    });
    const compact = await cache.getEvents(
      { uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1, compactProgress: true },
      'json',
    );
    const full = await cache.getEvents(
      { uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1, compactProgress: false },
      'json',
    );
    if (compact.format !== 'json' || full.format !== 'json') throw new Error('expected JSON results');

    expect(compact.data.events.map((event) => event.eventId)).toEqual([1, 4]);
    expect(full.data.events.map((event) => event.eventId)).toEqual([1, 2, 3, 4]);
    expect(loader.rangeReadCount).toBe(1);
    compact.release();
    full.release();
  });

  it('fails closed and rebuilds when a settle exceeds the synchronous projection chunk budget', async () => {
    const initial = projectionRebuildInitialEvents();
    const loader = new ScriptedLoader(initial);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
      chunkEventCount: 2,
      maxSynchronousProjectionChunks: 1,
    });
    const warm = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    warm.release();
    const settleEvent = readableEvent({
      eventId: 5,
      type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE,
      solutionOnResultSettleData: {
        solutionId: 7,
        result: rankland_live_contest_common.Result.AC,
        time: { value: 2, unit: rankland_live_contest_common.TimeUnit.S },
      },
    });
    loader.appendEvent(settleEvent);

    cache.observeCommittedAppend({
      contestId: '101',
      canonicalUk: 'Contest-A',
      streamRevision: 1,
      lastEventId: 5,
      events: [settleEvent],
    });
    const rebuilt = await cache.getEvents(
      { uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1, compactProgress: true },
      'json',
    );
    if (rebuilt.format !== 'json') throw new Error('expected JSON result');

    expect(rebuilt.data.events.map((event) => event.eventId)).toEqual([1, 3, 5]);
    expect(loader.rangeReadCount).toBe(2);
    expect(cache.snapshotCounters().projectionRebuilds).toBe(1);
    rebuilt.release();
  });

  it('limits full hydration work across different contests', async () => {
    const base = readableEvent({
      eventId: 1,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    const loader = new DeferredRangeLoader([
      { ...base, contestId: '101' },
      { ...base, contestId: '102' },
    ]);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
      hydrationConcurrency: 1,
    });

    const first = cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    const second = cache.getEvents({ uk: 'Contest-B', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    await loader.firstRangeStarted;
    await Promise.resolve();

    expect(loader.rangeReadCount).toBe(1);
    expect(loader.maxActiveRangeReads).toBe(1);
    loader.releaseRanges();
    const results = await Promise.all([first, second]);
    expect(loader.rangeReadCount).toBe(2);
    expect(loader.maxActiveRangeReads).toBe(1);
    results.forEach((result) => result.release());
  });

  it('singleflights one cold generation for 100 concurrent viewers', async () => {
    const loader = new ScriptedLoader([
      readableEvent({
        eventId: 1,
        type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
        contestConfigChangeData: { changedFields: [] },
      }),
    ]);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
    });

    const results = await Promise.all(
      Array.from({ length: 100 }, () =>
        cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json'),
      ),
    );

    expect(loader.rangeReadCount).toBe(1);
    expect(cache.snapshotCounters().singleflightJoins).toBeGreaterThanOrEqual(99);
    results.forEach((result) => result.release());
  });

  it('coalesces a same-revision append into one in-flight cold hydration', async () => {
    const first = readableEvent({
      eventId: 1,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    const loader = new DeferredHydrationLoader([first]);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
    });
    const reads = Array.from({ length: 100 }, () =>
      cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json'),
    );
    await loader.rangeStarted;
    const second = readableEvent({
      eventId: 2,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    loader.appendEvent(second);

    cache.observeCommittedAppend({
      contestId: '101',
      canonicalUk: 'Contest-A',
      streamRevision: 1,
      lastEventId: 2,
      events: [second],
    });
    loader.releaseRange();
    const results = await Promise.all(reads);

    for (const result of results) {
      if (result.format !== 'json') throw new Error('expected JSON result');
      expect(result.data).toMatchObject({ latestEventId: 2, checkpointEventId: 2 });
      expect(result.data.events.map((event) => event.eventId)).toEqual([1, 2]);
      result.release();
    }
    expect(loader.rangeReadCount).toBe(2);
    expect(cache.snapshotCounters()).toMatchObject({
      hydrationStarted: 1,
      hydrationCompleted: 1,
      generationDiscards: 0,
      targetAdvancesDuringHydration: 1,
      writeThroughDeferred: 1,
    });
  });

  it('coalesces a same-revision append that races the final hydration authority read', async () => {
    const first = readableEvent({
      eventId: 1,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    const loader = new DeferredHydrationAuthorityLoader([first]);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
    });
    const reads = Array.from({ length: 20 }, () =>
      cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json'),
    );
    await loader.finalAuthorityStarted;
    const second = readableEvent({
      eventId: 2,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    loader.appendEvent(second);
    cache.observeCommittedAppend({
      contestId: '101',
      canonicalUk: 'Contest-A',
      streamRevision: 1,
      lastEventId: 2,
      events: [second],
    });
    loader.releaseFinalAuthority();
    const results = await Promise.all(reads);

    for (const result of results) {
      if (result.format !== 'json') throw new Error('expected JSON result');
      expect(result.data.latestEventId).toBe(2);
      result.release();
    }
    expect(loader.rangeReadCount).toBe(2);
    expect(cache.snapshotCounters()).toMatchObject({
      hydrationStarted: 1,
      hydrationCompleted: 1,
      generationDiscards: 0,
      authorityResultsStaleByTargetAdvance: 1,
    });
  });

  it('retries within one hydration flight when the target advances during a projection rebuild', async () => {
    const initial = projectionRebuildInitialEvents();
    const loader = new DeferredProjectionRebuildLoader(initial);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
      chunkEventCount: 2,
      maxSynchronousProjectionChunks: 1,
    });
    const warm = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    warm.release();
    const gap = readableEvent({
      eventId: 5,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    const settle = readableEvent({
      eventId: 6,
      type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE,
      solutionOnResultSettleData: {
        solutionId: 7,
        result: rankland_live_contest_common.Result.AC,
        time: { value: 2, unit: rankland_live_contest_common.TimeUnit.S },
      },
    });
    loader.appendEvent(gap);
    loader.appendEvent(settle);
    cache.observeCommittedAppend({
      contestId: '101',
      canonicalUk: 'Contest-A',
      streamRevision: 1,
      lastEventId: 6,
      events: [settle],
    });
    loader.armProjectionRebuild();
    const reads = Array.from({ length: 20 }, () =>
      cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json'),
    );
    await loader.projectionRebuildStarted;
    const appendedDuringRebuild = readableEvent({
      eventId: 7,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    loader.appendEvent(appendedDuringRebuild);
    cache.observeCommittedAppend({
      contestId: '101',
      canonicalUk: 'Contest-A',
      streamRevision: 1,
      lastEventId: 7,
      events: [appendedDuringRebuild],
    });
    loader.releaseProjectionRebuild();
    const results = await Promise.all(reads);

    for (const result of results) {
      if (result.format !== 'json') throw new Error('expected JSON result');
      expect(result.data.latestEventId).toBe(7);
      expect(result.data.events.map((event) => event.eventId)).toEqual([1, 3, 5, 6, 7]);
      result.release();
    }
    expect(loader.rangeReadCount).toBe(5);
    expect(cache.snapshotCounters()).toMatchObject({
      hydrationStarted: 2,
      hydrationCompleted: 2,
      generationDiscards: 0,
      hydrationStabilizationFailures: 0,
      targetAdvancesDuringHydration: 1,
      writeThroughDeferred: 2,
    });
  });

  it('bounds repeated projection rebuild races and releases every builder reservation', async () => {
    const loader = new AdvancingProjectionRebuildLoader(projectionRebuildInitialEvents());
    const cache = new ContestEventReadCache(loader, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
      chunkEventCount: 2,
      maxSynchronousProjectionChunks: 1,
    });
    const warm = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    warm.release();
    const authorityReadsBeforeRecovery = loader.finalAuthorityReadCount;
    const gap = readableEvent({
      eventId: 5,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    const settle = readableEvent({
      eventId: 6,
      type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE,
      solutionOnResultSettleData: {
        solutionId: 7,
        result: rankland_live_contest_common.Result.AC,
        time: { value: 2, unit: rankland_live_contest_common.TimeUnit.S },
      },
    });
    loader.appendEvent(gap);
    loader.appendEvent(settle);
    cache.observeCommittedAppend({
      contestId: '101',
      canonicalUk: 'Contest-A',
      streamRevision: 1,
      lastEventId: 6,
      events: [settle],
    });
    loader.arm((event) => {
      cache.observeCommittedAppend({
        contestId: '101',
        canonicalUk: 'Contest-A',
        streamRevision: 1,
        lastEventId: event.eventId,
        events: [event],
      });
    });

    await expect(
      cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json'),
    ).rejects.toThrow(/target did not stabilize/i);

    expect(loader.finalAuthorityReadCount - authorityReadsBeforeRecovery).toBe(2);
    expect(cache.snapshotCounters()).toMatchObject({
      hydrationStarted: 2,
      hydrationCompleted: 1,
      generationDiscards: 0,
      hydrationStabilizationFailures: 1,
      targetAdvancesDuringHydration: 2,
      projectionRebuilds: 2,
      builderReservedBytes: 0,
    });
  });

  it('tail-fills a same-revision local append gap without replacing the generation', async () => {
    const first = readableEvent({
      eventId: 1,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    const loader = new ScriptedLoader([first]);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
    });
    const warm = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    warm.release();
    const second = readableEvent({
      eventId: 2,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    const third = readableEvent({
      eventId: 3,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    loader.appendEvent(second);
    loader.appendEvent(third);

    cache.observeCommittedAppend({
      contestId: '101',
      canonicalUk: 'Contest-A',
      streamRevision: 1,
      lastEventId: 3,
      events: [third],
    });
    const recovered = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    if (recovered.format !== 'json') throw new Error('expected JSON result');

    expect(recovered.data.events.map((event) => event.eventId)).toEqual([1, 2, 3]);
    expect(loader.rangeReadCount).toBe(2);
    expect(cache.snapshotCounters()).toMatchObject({ generationDiscards: 0, writeThroughDeferred: 1 });
    recovered.release();
  });

  it('rebuilds from scratch when retaining the unpinned base snapshot would exceed the entry budget', async () => {
    const first = readableEvent({
      eventId: 1,
      type: rankland_live_contest_common.EventType.NEW_SOLUTION,
      newSolutionData: {
        solutionId: 1,
        userId: 'u'.repeat(16 * 1024),
        problemAlias: 'A',
        time: { value: 1, unit: rankland_live_contest_common.TimeUnit.S },
      },
    });
    const probe = new ContestEventReadCache(new ScriptedLoader([first]), {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
    });
    const probeResult = await probe.getEvents(
      { uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 },
      'json',
    );
    probeResult.release();
    const baseBytes = probe.snapshotCounters().residentBytes;
    probe.dispose();

    const second = readableEvent({
      eventId: 2,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    const third = readableEvent({
      eventId: 3,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    const fullProbe = new ContestEventReadCache(new ScriptedLoader([first, second, third]), {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
    });
    const fullProbeResult = await fullProbe.getEvents(
      { uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 },
      'json',
    );
    fullProbeResult.release();
    const fullBuildBytes = fullProbe.snapshotCounters().highWaterAccountedBytes;
    fullProbe.dispose();

    const loader = new ScriptedLoader([first]);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: fullBuildBytes + baseBytes,
      maxEntryBytes: fullBuildBytes,
    });
    const warm = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    warm.release();
    loader.appendEvent(second);
    loader.appendEvent(third);
    cache.observeCommittedAppend({
      contestId: '101',
      canonicalUk: 'Contest-A',
      streamRevision: 1,
      lastEventId: 3,
      events: [third],
    });
    const rebuilt = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    if (rebuilt.format !== 'json') throw new Error('expected JSON result');

    expect(rebuilt.data.events.map((event) => event.eventId)).toEqual([1, 2, 3]);
    expect(loader.rangeReadCount).toBe(3);
    expect(cache.snapshotCounters()).toMatchObject({
      residentContests: 1,
      generationDiscards: 0,
      writeThroughDeferred: 1,
    });
    rebuilt.release();
  });

  it('retries an authority result made stale by a same-revision target advance', async () => {
    const first = readableEvent({
      eventId: 1,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    const loader = new DeferredRefreshSnapshotLoader([first]);
    let now = 0;
    const cache = new ContestEventReadCache(loader, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
      authorityLeaseMs: 10,
      now: () => now,
    });
    const warm = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    warm.release();
    now = 20;
    const pending = cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    await loader.refreshStarted;
    const second = readableEvent({
      eventId: 2,
      type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: { changedFields: [] },
    });
    loader.appendEvent(second);
    cache.observeCommittedAppend({
      contestId: '101',
      canonicalUk: 'Contest-A',
      streamRevision: 1,
      lastEventId: 2,
      events: [second],
    });
    loader.releaseRefresh();
    const result = await pending;
    if (result.format !== 'json') throw new Error('expected JSON result');

    expect(result.data.latestEventId).toBe(2);
    expect(result.data.events.map((event) => event.eventId)).toEqual([1, 2]);
    expect(loader.authorityByUkReadCount).toBe(3);
    expect(loader.rangeReadCount).toBe(1);
    expect(cache.snapshotCounters()).toMatchObject({
      authorityResultsStaleByTargetAdvance: 1,
      generationDiscards: 0,
      hydrationStarted: 1,
      hydrationCompleted: 1,
    });
    result.release();
  });

  it('fails closed when SQL row metadata disagrees with the canonical payload', async () => {
    const valid = readableEvent({
      eventId: 1,
      type: rankland_live_contest_common.EventType.NEW_SOLUTION,
      newSolutionData: {
        solutionId: 7,
        userId: 'u7',
        problemAlias: 'A',
        time: { value: 1, unit: rankland_live_contest_common.TimeUnit.S },
      },
    });
    const loader = new ScriptedLoader([{ ...valid, solutionId: 999 }]);
    const cache = new ContestEventReadCache(loader, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
      failureCooldownMs: 1_000,
    });

    await expect(
      cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json'),
    ).rejects.toThrow(/temporarily unavailable/i);
    await expect(
      cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json'),
    ).rejects.toThrow(/failure cooldown/i);
    expect(loader.rangeReadCount).toBe(1);
    expect(cache.snapshotCounters()).toMatchObject({ residentContests: 0, builderReservedBytes: 0 });
  });

  it('preflights and reserves builder bytes before every hydration-page fetch', async () => {
    const events = [1, 2].map((eventId) =>
      readableEvent({
        eventId,
        type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
        contestConfigChangeData: { changedFields: [] },
      }),
    );
    const reservedBeforePage: number[] = [];
    let cache!: ContestEventReadCache;
    const loader = new ReservationObservingLoader(events, () => {
      reservedBeforePage.push(cache.snapshotCounters().builderReservedBytes);
    });
    cache = new ContestEventReadCache(loader, {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
      hydrationPageSize: 1,
    });

    const result = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    result.release();

    expect(reservedBeforePage).toHaveLength(2);
    expect(reservedBeforePage.every((bytes) => bytes > 0)).toBe(true);
    expect(cache.snapshotCounters().builderReservedBytes).toBe(0);
  });

  it('accounts source rows and the materialized snapshot while both are live', async () => {
    const events = projectionRebuildInitialEvents();
    const expectedSnapshot = buildContestEventCacheSnapshot({
      contestId: '101',
      streamRevision: 1,
      targetLastEventId: events.length,
      chunkEventCount: 8,
      events,
    });
    const expectedOverlappingBytes =
      estimateContestReadableEventsBufferedBytes(events) + expectedSnapshot.estimatedBytes;
    const cache = new ContestEventReadCache(new ScriptedLoader(events), {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
      chunkEventCount: 8,
    });

    const result = await cache.getEvents({ uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
    result.release();

    expect(cache.snapshotCounters().highWaterAccountedBytes).toBeGreaterThanOrEqual(expectedOverlappingBytes);
  });

  it('expires idle snapshots and evicts the least recently used contest by byte budget', async () => {
    const events = ['101', '102', '103'].map((contestId) => ({
      ...readableEvent({
        eventId: 1,
        type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
        contestConfigChangeData: { changedFields: [] },
      }),
      contestId,
    }));
    const probe = new ContestEventReadCache(new MultiContestLoader(events), {
      maxBytes: 1024 * 1024,
      maxEntryBytes: 1024 * 1024,
    });
    const probeResult = await probe.getEvents(
      { uk: 'Contest-A', afterEventId: 0, limit: 10, streamRevision: 1 },
      'json',
    );
    probeResult.release();
    const oneEntryBytes = probe.snapshotCounters().residentBytes;
    const oneBuildBytes = probe.snapshotCounters().highWaterAccountedBytes;
    probe.dispose();

    let now = 0;
    const cache = new ContestEventReadCache(new MultiContestLoader(events), {
      maxBytes: oneEntryBytes + oneBuildBytes,
      maxEntryBytes: oneBuildBytes,
      idleTtlMs: 10,
      now: () => now,
    });
    const read = async (uk: string) => {
      const result = await cache.getEvents({ uk, afterEventId: 0, limit: 10, streamRevision: 1 }, 'json');
      result.release();
    };
    await read('Contest-A');
    now = 1;
    await read('Contest-B');
    now = 2;
    await read('Contest-A');
    now = 3;
    await read('Contest-C');

    expect(cache.getActiveContestIds().sort()).toEqual(['101', '103']);
    expect(cache.snapshotCounters().lruEvictions).toBe(1);

    now = 20;
    await read('Contest-B');
    expect(cache.snapshotCounters().ttlEvictions).toBeGreaterThanOrEqual(2);
    expect(cache.snapshotCounters()).toMatchObject({ builderReservedBytes: 0 });
    expect(cache.snapshotCounters().highWaterAccountedBytes).toBeLessThanOrEqual(oneEntryBytes + oneBuildBytes);
  });

  it('matches the legacy reader across a fixed-seed mixed event sequence and raw page boundaries', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('Contest-A', {
      contestId: '101',
      contest: { duration: [5, 'h'], frozenDuration: [1, 'h'] },
    });
    const service = new ContestEventStreamService(store);
    const events = fixedSeedMixedEvents();
    await service.appendProducerEvents({
      uk: 'Contest-A',
      producerId: 'producer-a',
      batch: parseProducerBatchJson({ streamRevision: 1, events }),
    });
    const cache = new ContestEventReadCache(store, {
      maxBytes: 8 * 1024 * 1024,
      maxEntryBytes: 8 * 1024 * 1024,
      chunkEventCount: 7,
    });

    for (const compactProgress of [false, true]) {
      for (const limit of [1, 7, 13, 1000]) {
        for (let afterEventId = 0; afterEventId <= events.length; afterEventId += 1) {
          const input = { uk: 'Contest-A', afterEventId, limit, streamRevision: 1, compactProgress };
          const legacy = getContestEventsResponseToJson(await service.getClientEvents(input));
          const cached = await cache.getEvents(input, 'json');
          if (cached.format !== 'json') throw new Error('expected JSON result');
          expect(cached.data).toEqual(legacy);
          cached.release();
        }
      }
    }
  });
});

class ScriptedLoader implements ContestEventReadCacheLoader {
  public rangeReadCount = 0;
  public readonly rangeReads: ContestEventRangeRead[] = [];
  public authorityByUkReadCount = 0;
  protected readonly state: ContestEventAuthorityState;
  private readonly events: ContestReadableEvent[];

  public constructor(events: readonly ContestReadableEvent[], state: Partial<ContestEventAuthorityState> = {}) {
    this.events = [...events];
    this.state = {
      contestId: '101',
      canonicalUk: 'Contest-A',
      streamRevision: 1,
      lastEventId: events.length,
      frozenStartNs: null,
      visibilityFingerprint: 'duration=18000;frozen=null',
      ...state,
    };
  }

  public appendEvent(event: ContestReadableEvent): void {
    this.events.push(event);
    this.state.lastEventId = event.eventId;
  }

  public setAuthority(patch: Partial<ContestEventAuthorityState>): void {
    Object.assign(this.state, patch);
  }

  public async readAuthorityByUk(): Promise<ContestEventAuthorityState> {
    this.authorityByUkReadCount += 1;
    return { ...this.state };
  }

  public async readAuthorityByContestIds(contestIds: readonly string[]): Promise<ContestEventAuthorityState[]> {
    return contestIds.includes(this.state.contestId) ? [{ ...this.state }] : [];
  }

  public async estimateEventRangeMemory(request: ContestEventRangeRead): Promise<ContestEventRangeMemoryEstimate> {
    return memoryEstimate(this.selectEventRange(request));
  }

  public async readEventRange(request: ContestEventRangeRead): Promise<ContestReadableEvent[]> {
    this.rangeReadCount += 1;
    this.rangeReads.push({ ...request });
    return this.selectEventRange(request);
  }

  protected selectEventRange(request: ContestEventRangeRead): ContestReadableEvent[] {
    return this.events
      .filter(
        (event) =>
          event.contestId === request.contestId &&
          event.streamRevision === request.streamRevision &&
          event.eventId > request.afterEventId &&
          event.eventId <= request.throughEventId,
      )
      .slice(0, request.limit);
  }
}

class ReservationObservingLoader extends ScriptedLoader {
  public constructor(events: readonly ContestReadableEvent[], private readonly beforePageFetch: () => void) {
    super(events);
  }

  public override async readEventRange(request: ContestEventRangeRead): Promise<ContestReadableEvent[]> {
    this.beforePageFetch();
    return super.readEventRange(request);
  }
}

class DeferredAuthorityLoader extends ScriptedLoader {
  public readonly authorityStarted: Promise<void>;
  private resolveAuthorityStarted!: () => void;
  private readonly authorityGate: Promise<void>;
  private resolveAuthorityGate!: () => void;

  public constructor(events: readonly ContestReadableEvent[]) {
    super(events);
    this.authorityStarted = new Promise((resolve) => {
      this.resolveAuthorityStarted = resolve;
    });
    this.authorityGate = new Promise((resolve) => {
      this.resolveAuthorityGate = resolve;
    });
  }

  public releaseAuthority(): void {
    this.resolveAuthorityGate();
  }

  public override async readAuthorityByUk(): Promise<ContestEventAuthorityState> {
    this.resolveAuthorityStarted();
    await this.authorityGate;
    return super.readAuthorityByUk();
  }
}

class DeferredHydrationLoader extends ScriptedLoader {
  public readonly rangeStarted: Promise<void>;
  private resolveRangeStarted!: () => void;
  private readonly rangeGate: Promise<void>;
  private resolveRangeGate!: () => void;

  public constructor(events: readonly ContestReadableEvent[]) {
    super(events);
    this.rangeStarted = new Promise((resolve) => {
      this.resolveRangeStarted = resolve;
    });
    this.rangeGate = new Promise((resolve) => {
      this.resolveRangeGate = resolve;
    });
  }

  public releaseRange(): void {
    this.resolveRangeGate();
  }

  public override async readEventRange(request: ContestEventRangeRead): Promise<ContestReadableEvent[]> {
    this.resolveRangeStarted();
    await this.rangeGate;
    return super.readEventRange(request);
  }
}

class TailDeferredLoader extends ScriptedLoader {
  public readonly tailStarted: Promise<void>;
  private resolveTailStarted!: () => void;
  private readonly tailGate: Promise<void>;
  private resolveTailGate!: () => void;
  private tailBlockArmed = false;

  public constructor(events: readonly ContestReadableEvent[]) {
    super(events);
    this.tailStarted = new Promise((resolve) => {
      this.resolveTailStarted = resolve;
    });
    this.tailGate = new Promise((resolve) => {
      this.resolveTailGate = resolve;
    });
  }

  public armTailBlock(): void {
    this.tailBlockArmed = true;
  }

  public releaseTail(): void {
    this.resolveTailGate();
  }

  public override async readEventRange(request: ContestEventRangeRead): Promise<ContestReadableEvent[]> {
    if (this.tailBlockArmed && request.afterEventId > 0) {
      this.tailBlockArmed = false;
      this.resolveTailStarted();
      await this.tailGate;
    }
    return super.readEventRange(request);
  }
}

class DeferredHydrationAuthorityLoader extends ScriptedLoader {
  public readonly finalAuthorityStarted: Promise<void>;
  private resolveFinalAuthorityStarted!: () => void;
  private readonly finalAuthorityGate: Promise<void>;
  private resolveFinalAuthorityGate!: () => void;
  private finalAuthorityReadCount = 0;

  public constructor(events: readonly ContestReadableEvent[]) {
    super(events);
    this.finalAuthorityStarted = new Promise((resolve) => {
      this.resolveFinalAuthorityStarted = resolve;
    });
    this.finalAuthorityGate = new Promise((resolve) => {
      this.resolveFinalAuthorityGate = resolve;
    });
  }

  public releaseFinalAuthority(): void {
    this.resolveFinalAuthorityGate();
  }

  public override async readAuthorityByContestIds(
    contestIds: readonly string[],
  ): Promise<ContestEventAuthorityState[]> {
    const snapshot = await super.readAuthorityByContestIds(contestIds);
    this.finalAuthorityReadCount += 1;
    if (this.finalAuthorityReadCount === 1) {
      this.resolveFinalAuthorityStarted();
      await this.finalAuthorityGate;
    }
    return snapshot;
  }
}

class DeferredProjectionRebuildLoader extends ScriptedLoader {
  public readonly projectionRebuildStarted: Promise<void>;
  private resolveProjectionRebuildStarted!: () => void;
  private readonly projectionRebuildGate: Promise<void>;
  private resolveProjectionRebuildGate!: () => void;
  private projectionRebuildArmed = false;
  private projectionRebuildBlocked = false;

  public constructor(events: readonly ContestReadableEvent[]) {
    super(events);
    this.projectionRebuildStarted = new Promise((resolve) => {
      this.resolveProjectionRebuildStarted = resolve;
    });
    this.projectionRebuildGate = new Promise((resolve) => {
      this.resolveProjectionRebuildGate = resolve;
    });
  }

  public armProjectionRebuild(): void {
    this.projectionRebuildArmed = true;
  }

  public releaseProjectionRebuild(): void {
    this.resolveProjectionRebuildGate();
  }

  public override async readEventRange(request: ContestEventRangeRead): Promise<ContestReadableEvent[]> {
    if (this.projectionRebuildArmed && !this.projectionRebuildBlocked && request.afterEventId === 0) {
      this.projectionRebuildBlocked = true;
      this.resolveProjectionRebuildStarted();
      await this.projectionRebuildGate;
    }
    return super.readEventRange(request);
  }
}

class AdvancingProjectionRebuildLoader extends ScriptedLoader {
  public finalAuthorityReadCount = 0;
  private onProjectionRebuild?: (event: ContestReadableEvent) => void;

  public arm(onProjectionRebuild: (event: ContestReadableEvent) => void): void {
    this.onProjectionRebuild = onProjectionRebuild;
  }

  public override async readAuthorityByContestIds(
    contestIds: readonly string[],
  ): Promise<ContestEventAuthorityState[]> {
    this.finalAuthorityReadCount += 1;
    return super.readAuthorityByContestIds(contestIds);
  }

  public override async readEventRange(request: ContestEventRangeRead): Promise<ContestReadableEvent[]> {
    const rows = await super.readEventRange(request);
    if (this.onProjectionRebuild && request.afterEventId === 0 && request.throughEventId >= 6) {
      const event = readableEvent({
        eventId: request.throughEventId + 1,
        type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
        contestConfigChangeData: { changedFields: [] },
      });
      this.appendEvent(event);
      this.onProjectionRebuild(event);
    }
    return rows;
  }
}

class DeferredRefreshSnapshotLoader extends ScriptedLoader {
  public readonly refreshStarted: Promise<void>;
  private resolveRefreshStarted!: () => void;
  private readonly refreshGate: Promise<void>;
  private resolveRefreshGate!: () => void;

  public constructor(events: readonly ContestReadableEvent[]) {
    super(events);
    this.refreshStarted = new Promise((resolve) => {
      this.resolveRefreshStarted = resolve;
    });
    this.refreshGate = new Promise((resolve) => {
      this.resolveRefreshGate = resolve;
    });
  }

  public releaseRefresh(): void {
    this.resolveRefreshGate();
  }

  public override async readAuthorityByUk(): Promise<ContestEventAuthorityState> {
    const snapshot = await super.readAuthorityByUk();
    if (this.authorityByUkReadCount === 2) {
      this.resolveRefreshStarted();
      await this.refreshGate;
    }
    return snapshot;
  }
}

class DeferredRangeLoader implements ContestEventReadCacheLoader {
  public rangeReadCount = 0;
  public maxActiveRangeReads = 0;
  public readonly firstRangeStarted: Promise<void>;
  private activeRangeReads = 0;
  private resolveFirstRangeStarted!: () => void;
  private readonly rangeGate: Promise<void>;
  private resolveRangeGate!: () => void;

  public constructor(private readonly events: readonly ContestReadableEvent[]) {
    this.firstRangeStarted = new Promise((resolve) => {
      this.resolveFirstRangeStarted = resolve;
    });
    this.rangeGate = new Promise((resolve) => {
      this.resolveRangeGate = resolve;
    });
  }

  public releaseRanges(): void {
    this.resolveRangeGate();
  }

  public async readAuthorityByUk(uk: string): Promise<ContestEventAuthorityState> {
    const contestId = uk.toLocaleLowerCase('en-US') === 'contest-a' ? '101' : '102';
    return this.authority(contestId, uk);
  }

  public async readAuthorityByContestIds(contestIds: readonly string[]): Promise<ContestEventAuthorityState[]> {
    return contestIds.map((contestId) => this.authority(contestId, contestId === '101' ? 'Contest-A' : 'Contest-B'));
  }

  public async estimateEventRangeMemory(request: ContestEventRangeRead): Promise<ContestEventRangeMemoryEstimate> {
    return memoryEstimate(this.selectEventRange(request));
  }

  public async readEventRange(request: ContestEventRangeRead): Promise<ContestReadableEvent[]> {
    this.rangeReadCount += 1;
    this.activeRangeReads += 1;
    this.maxActiveRangeReads = Math.max(this.maxActiveRangeReads, this.activeRangeReads);
    this.resolveFirstRangeStarted();
    await this.rangeGate;
    this.activeRangeReads -= 1;
    return this.selectEventRange(request);
  }

  private selectEventRange(request: ContestEventRangeRead): ContestReadableEvent[] {
    return this.events.filter(
      (event) =>
        event.contestId === request.contestId &&
        event.eventId > request.afterEventId &&
        event.eventId <= request.throughEventId,
    );
  }

  private authority(contestId: string, canonicalUk: string): ContestEventAuthorityState {
    return {
      contestId,
      canonicalUk,
      streamRevision: 1,
      lastEventId: 1,
      frozenStartNs: null,
      visibilityFingerprint: 'duration=18000;frozen=null',
    };
  }
}

class MultiContestLoader implements ContestEventReadCacheLoader {
  public constructor(private readonly events: readonly ContestReadableEvent[]) {}

  public async readAuthorityByUk(uk: string): Promise<ContestEventAuthorityState> {
    const suffix = uk.slice(-1).toLocaleUpperCase('en-US');
    const contestId = String(101 + Math.max(0, suffix.charCodeAt(0) - 65));
    return this.authority(contestId, uk);
  }

  public async readAuthorityByContestIds(contestIds: readonly string[]): Promise<ContestEventAuthorityState[]> {
    return contestIds.map((contestId) =>
      this.authority(contestId, `Contest-${String.fromCharCode(65 + Number(contestId) - 101)}`),
    );
  }

  public async estimateEventRangeMemory(request: ContestEventRangeRead): Promise<ContestEventRangeMemoryEstimate> {
    return memoryEstimate(this.selectEventRange(request));
  }

  public async readEventRange(request: ContestEventRangeRead): Promise<ContestReadableEvent[]> {
    return this.selectEventRange(request);
  }

  private selectEventRange(request: ContestEventRangeRead): ContestReadableEvent[] {
    return this.events.filter(
      (event) =>
        event.contestId === request.contestId &&
        event.eventId > request.afterEventId &&
        event.eventId <= request.throughEventId,
    );
  }

  private authority(contestId: string, canonicalUk: string): ContestEventAuthorityState {
    return {
      contestId,
      canonicalUk,
      streamRevision: 1,
      lastEventId: 1,
      frozenStartNs: null,
      visibilityFingerprint: 'duration=18000;frozen=null',
    };
  }
}

function memoryEstimate(events: readonly ContestReadableEvent[]): ContestEventRangeMemoryEstimate {
  return {
    rowCount: events.length,
    payloadBytes: events.reduce((total, event) => total + event.payloadBytes.byteLength, 0),
    solutionSubmitTimeBytes: events.reduce(
      (total, event) => total + Buffer.byteLength(event.solutionSubmitTimeNs ?? '', 'utf8'),
      0,
    ),
  };
}

function fixedSeedMixedEvents(): any[] {
  const events: any[] = [];
  let eventId = 1;
  for (let solutionId = 1; solutionId <= 6; solutionId += 1) {
    events.push({
      eventId: eventId++,
      type: rankland_live_contest_common.EventType.NEW_SOLUTION,
      newSolutionData: {
        solutionId,
        userId: `u${solutionId}`,
        problemAlias: String.fromCharCode(64 + solutionId),
        time: {
          value: solutionId % 2 === 0 ? 14_400 : 3_600,
          unit: rankland_live_contest_common.TimeUnit.S,
        },
      },
    });
  }
  let state = 0x5eed1234;
  const next = () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state;
  };
  for (let index = 0; index < 48; index += 1) {
    const solutionId = (next() % 6) + 1;
    const kind = next() % 4;
    if (kind === 0) {
      events.push({
        eventId: eventId++,
        type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
        solutionOnProgressData: { solutionId, percentageProgress: next() % 101 },
      });
    } else if (kind === 1) {
      events.push({
        eventId: eventId++,
        type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE,
        solutionOnResultSettleData: {
          solutionId,
          result: rankland_live_contest_common.Result.AC,
          time: { value: next() % 20_000, unit: rankland_live_contest_common.TimeUnit.S },
        },
      });
    } else if (kind === 2) {
      events.push({
        eventId: eventId++,
        type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE,
        solutionOnResultChangeData: {
          solutionId,
          previousResult: rankland_live_contest_common.Result.WA,
          result: rankland_live_contest_common.Result.AC,
          time: { value: next() % 20_000, unit: rankland_live_contest_common.TimeUnit.S },
        },
      });
    } else {
      events.push({
        eventId: eventId++,
        type: rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE,
        contestConfigChangeData: { changedFields: [] },
      });
    }
  }
  return events;
}
