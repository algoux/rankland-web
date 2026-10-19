import { describe, expect, it, vi } from 'vitest';
import { ContestEventConsumer } from './contest-event-consumer';
import { LiveContestTransportError } from '@/services/ranklist-api/live-contest-transport';
import type {
  LiveContestEvent,
  LiveContestEventPage,
  LiveContestEventsAvailable,
  LiveContestTransport,
} from '@/services/ranklist-api/live-contest-types';

function event(eventId: number): LiveContestEvent {
  return {
    eventId,
    type: 'CONFIG_CHANGE',
    changedFields: [],
  };
}

function page(
  checkpointEventId: number,
  latestEventId: number,
  events: LiveContestEvent[],
  overrides: Partial<LiveContestEventPage> = {},
): LiveContestEventPage {
  return {
    uk: 'summer-2026',
    fromEventId: events[0]?.eventId ?? null,
    toEventId: events.at(-1)?.eventId ?? null,
    checkpointEventId,
    latestEventId,
    streamRevision: 1,
    hasMore: checkpointEventId < latestEventId,
    resetRequired: false,
    resetReason: '',
    events,
    ...overrides,
  };
}

function waitUntilAborted(_milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((_resolve, reject) => {
    signal.addEventListener('abort', () => {
      const error = new Error('aborted');
      error.name = 'AbortError';
      reject(error);
    });
  });
}

function createHarness(options: {
  initialWatermark?: number;
  pages: LiveContestEventPage[];
}) {
  let available: ((payload: LiveContestEventsAvailable) => void) | undefined;
  const closeSubscription = vi.fn();
  const getEvents = vi.fn(async (_request: {
    afterEventId: number;
    signal: AbortSignal;
    streamRevision: number;
    uk: string;
  }) => {
    const next = options.pages.shift();
    if (!next) {
      throw new Error('unexpected getEvents call');
    }
    return next;
  });
  const transport: LiveContestTransport = {
    getContest: vi.fn() as never,
    getStreamState: vi.fn(async () => ({
      uk: 'summer-2026',
      lastEventId: options.initialWatermark ?? 0,
      streamRevision: 1,
    })),
    getEvents,
    subscribeEvents: vi.fn((_uk, callbacks) => {
      available = callbacks.onAvailable;
      return { close: closeSubscription };
    }),
  };
  const onInitialEvents = vi.fn();
  const onEvents = vi.fn();
  const onReset = vi.fn();
  const onFatal = vi.fn();
  const consumer = new ContestEventConsumer({
    transport,
    onInitialEvents,
    onEvents,
    onReset,
    onFatal,
    sleep: vi.fn(async () => {}),
  });
  return {
    consumer,
    closeSubscription,
    getEvents,
    onEvents,
    onFatal,
    onInitialEvents,
    onReset,
    notify(payload: LiveContestEventsAvailable) {
      if (!available) {
        throw new Error('SSE subscription is not ready');
      }
      available(payload);
    },
  };
}

describe('ContestEventConsumer', () => {
  it('cuts an overshooting first page at the opening watermark and refetches the surplus as live events', async () => {
    const harness = createHarness({
      initialWatermark: 2,
      pages: [
        page(4, 4, [event(1), event(2), event(3), event(4)]),
        page(4, 4, [event(3), event(4)]),
      ],
    });

    await harness.consumer.start('summer-2026');

    expect(harness.onInitialEvents).toHaveBeenCalledWith([event(1), event(2)], true);
    expect(harness.onEvents).toHaveBeenCalledWith([event(3), event(4)]);
    expect(harness.getEvents.mock.calls.map(([request]) => request.afterEventId)).toEqual([0, 2]);
    expect(harness.onFatal).not.toHaveBeenCalled();
  });

  it('advances an empty compact page by checkpointEventId', async () => {
    const harness = createHarness({
      initialWatermark: 3,
      pages: [page(3, 3, [])],
    });

    await harness.consumer.start('summer-2026');

    expect(harness.onInitialEvents).toHaveBeenCalledWith([], true);
    expect(harness.getEvents).toHaveBeenCalledOnce();
    expect(harness.onFatal).not.toHaveBeenCalled();
  });

  it('closes the SSE subscription when the consumer stops', async () => {
    const harness = createHarness({
      initialWatermark: 0,
      pages: [],
    });
    await harness.consumer.start('summer-2026');

    harness.consumer.stop();

    expect(harness.closeSubscription).toHaveBeenCalledOnce();
  });

  it('ignores lower revisions and rebuilds from zero for a higher revision', async () => {
    const harness = createHarness({
      initialWatermark: 0,
      pages: [page(1, 1, [event(1)], { streamRevision: 2 })],
    });
    await harness.consumer.start('summer-2026');

    harness.notify({ uk: 'summer-2026', latestEventId: 99, streamRevision: 0 });
    harness.notify({ uk: 'summer-2026', latestEventId: 1, streamRevision: 2 });
    await vi.waitFor(() => expect(harness.onInitialEvents).toHaveBeenCalledTimes(2));

    expect(harness.onReset).toHaveBeenCalledWith('stream revision changed');
    expect(harness.getEvents).toHaveBeenCalledWith(expect.objectContaining({
      afterEventId: 0,
      streamRevision: 2,
    }));
    expect(harness.onInitialEvents).toHaveBeenLastCalledWith([event(1)], true);
    expect(harness.onFatal).not.toHaveBeenCalled();
  });

  it('preserves the newest same-revision target when resetRequired starts a new generation', async () => {
    const harness = createHarness({
      initialWatermark: 0,
      pages: [
        page(0, 3, [], {
          resetRequired: true,
          resetReason: 'stream reset',
        }),
        page(5, 5, [event(1), event(2), event(3), event(4), event(5)]),
      ],
    });
    await harness.consumer.start('summer-2026');

    harness.notify({ uk: 'summer-2026', latestEventId: 5, streamRevision: 1 });
    await vi.waitFor(() => expect(harness.onInitialEvents).toHaveBeenCalledTimes(2));

    expect(harness.onReset).toHaveBeenCalledWith('stream reset');
    expect(harness.getEvents.mock.calls.map(([request]) => request.afterEventId)).toEqual([0, 0]);
    expect(harness.onInitialEvents).toHaveBeenLastCalledWith(
      [event(1), event(2), event(3), event(4), event(5)],
      true,
    );
  });

  it('honors Retry-After and retries without advancing the cursor', async () => {
    const sleep = vi.fn(async () => {});
    const getEvents = vi
      .fn()
      .mockRejectedValueOnce(new LiveContestTransportError('busy', {
        status: 503,
        transient: true,
        retryAfterMs: 2_000,
      }))
      .mockResolvedValueOnce(page(1, 1, [event(1)]));
    const transport = {
      getContest: vi.fn(),
      getStreamState: vi.fn(async () => ({
        uk: 'summer-2026',
        lastEventId: 1,
        streamRevision: 1,
      })),
      getEvents,
      subscribeEvents: vi.fn(() => ({ close: vi.fn() })),
    } as unknown as LiveContestTransport;
    const onInitialEvents = vi.fn();
    const consumer = new ContestEventConsumer({
      transport,
      onInitialEvents,
      onEvents: vi.fn(),
      onReset: vi.fn(),
      onFatal: vi.fn(),
      sleep,
    });

    await consumer.start('summer-2026');

    expect(sleep).toHaveBeenCalledWith(2_000, expect.any(AbortSignal));
    expect(getEvents.mock.calls.map(([request]) => request.afterEventId)).toEqual([0, 0]);
    expect(onInitialEvents).toHaveBeenCalledWith([event(1)], true);
  });

  it('publishes initial pages incrementally and marks only the boundary page complete', async () => {
    const harness = createHarness({
      initialWatermark: 3,
      pages: [
        page(1, 3, [event(1)]),
        page(3, 3, [event(2), event(3)]),
      ],
    });

    await harness.consumer.start('summer-2026');

    expect(harness.onInitialEvents.mock.calls).toEqual([
      [[event(1)], false],
      [[event(2), event(3)], true],
    ]);
    expect(harness.onFatal).not.toHaveBeenCalled();
  });

  it('rejects out-of-order event ids without advancing to another page', async () => {
    const harness = createHarness({
      initialWatermark: 3,
      pages: [
        page(3, 3, [event(2), event(1)]),
      ],
    });

    await harness.consumer.start('summer-2026');

    expect(harness.getEvents).toHaveBeenCalledOnce();
    expect(harness.onInitialEvents).not.toHaveBeenCalled();
    expect(harness.onFatal).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Contest event page has an invalid checkpoint or event sequence',
    }));
  });

  it('aborts a retry wait cleanly when a newer revision starts', async () => {
    let available: ((payload: LiveContestEventsAvailable) => void) | undefined;
    const sleep = vi.fn(waitUntilAborted);
    const getEvents = vi
      .fn()
      .mockRejectedValueOnce(new LiveContestTransportError('busy', {
        status: 503,
        transient: true,
      }))
      .mockResolvedValueOnce(page(1, 1, [event(1)], { streamRevision: 2 }));
    const onFatal = vi.fn();
    const onReset = vi.fn();
    const consumer = new ContestEventConsumer({
      transport: {
        getContest: vi.fn() as never,
        getStreamState: vi.fn(async () => ({
          uk: 'summer-2026',
          lastEventId: 0,
          streamRevision: 1,
        })),
        getEvents,
        subscribeEvents: vi.fn((_uk, callbacks) => {
          available = callbacks.onAvailable;
          return { close: vi.fn() };
        }),
      },
      onInitialEvents: vi.fn(),
      onEvents: vi.fn(),
      onReset,
      onFatal,
      sleep,
    });
    await consumer.start('summer-2026');

    available?.({ uk: 'summer-2026', latestEventId: 1, streamRevision: 1 });
    await vi.waitFor(() => expect(sleep).toHaveBeenCalledOnce());
    available?.({ uk: 'summer-2026', latestEventId: 1, streamRevision: 2 });
    await vi.waitFor(() => expect(getEvents).toHaveBeenCalledTimes(2));

    expect(onReset).toHaveBeenCalledWith('stream revision changed');
    expect(onFatal).not.toHaveBeenCalled();
  });

  it('waits for an aborted stale request to settle before fetching for a restarted contest', async () => {
    let resolveFirstPage: ((value: LiveContestEventPage) => void) | undefined;
    const firstPage = new Promise<LiveContestEventPage>((resolve) => {
      resolveFirstPage = resolve;
    });
    let activeFetches = 0;
    let maxActiveFetches = 0;
    const getEvents = vi.fn(async ({ uk }: { uk: string }) => {
      activeFetches += 1;
      maxActiveFetches = Math.max(maxActiveFetches, activeFetches);
      try {
        if (uk === 'summer-2026') {
          return await firstPage;
        }
        return {
          ...page(1, 1, [event(1)]),
          uk,
        };
      } finally {
        activeFetches -= 1;
      }
    });
    const onInitialEvents = vi.fn();
    const transport = {
      getContest: vi.fn(),
      getStreamState: vi.fn(async (uk: string) => ({
        uk,
        lastEventId: 1,
        streamRevision: 1,
      })),
      getEvents,
      subscribeEvents: vi.fn(() => ({ close: vi.fn() })),
    } as unknown as LiveContestTransport;
    const consumer = new ContestEventConsumer({
      transport,
      onInitialEvents,
      onEvents: vi.fn(),
      onReset: vi.fn(),
      onFatal: vi.fn(),
      sleep: vi.fn(async () => {}),
    });

    const firstStart = consumer.start('summer-2026');
    await vi.waitFor(() => expect(getEvents).toHaveBeenCalledTimes(1));
    const secondStart = consumer.start('autumn-2026');
    await Promise.resolve();
    expect(getEvents).toHaveBeenCalledTimes(1);

    resolveFirstPage?.(page(1, 1, [event(1)]));
    await Promise.all([firstStart, secondStart]);

    expect(maxActiveFetches).toBe(1);
    expect(getEvents).toHaveBeenLastCalledWith(expect.objectContaining({ uk: 'autumn-2026' }));
    expect(onInitialEvents).toHaveBeenCalledTimes(1);
  });

  it('coalesces a burst of SSE watermarks behind one serial catch-up runner', async () => {
    let available: ((payload: LiveContestEventsAvailable) => void) | undefined;
    let resolveFirstPage: ((value: LiveContestEventPage) => void) | undefined;
    const firstPage = new Promise<LiveContestEventPage>((resolve) => {
      resolveFirstPage = resolve;
    });
    let activeFetches = 0;
    let maxActiveFetches = 0;
    const getEvents = vi.fn(async ({ afterEventId }: { afterEventId: number }) => {
      activeFetches += 1;
      maxActiveFetches = Math.max(maxActiveFetches, activeFetches);
      try {
        if (afterEventId === 0) {
          return await firstPage;
        }
        return page(2, 2, [event(2)]);
      } finally {
        activeFetches -= 1;
      }
    });
    const onEvents = vi.fn();
    const consumer = new ContestEventConsumer({
      transport: {
        getContest: vi.fn() as never,
        getStreamState: vi.fn(async () => ({
          uk: 'summer-2026',
          lastEventId: 0,
          streamRevision: 1,
        })),
        getEvents,
        subscribeEvents: vi.fn((_uk, callbacks) => {
          available = callbacks.onAvailable;
          return { close: vi.fn() };
        }),
      },
      onInitialEvents: vi.fn(),
      onEvents,
      onReset: vi.fn(),
      onFatal: vi.fn(),
      sleep: vi.fn(async () => {}),
    });
    await consumer.start('summer-2026');

    available?.({ uk: 'summer-2026', latestEventId: 1, streamRevision: 1 });
    await vi.waitFor(() => expect(getEvents).toHaveBeenCalledOnce());
    for (let index = 0; index < 10_000; index += 1) {
      available?.({ uk: 'summer-2026', latestEventId: 2, streamRevision: 1 });
    }
    resolveFirstPage?.(page(1, 1, [event(1)]));
    await vi.waitFor(() => expect(onEvents).toHaveBeenCalledTimes(2));

    expect(getEvents.mock.calls.map(([request]) => request.afterEventId)).toEqual([0, 1]);
    expect(maxActiveFetches).toBe(1);
    consumer.stop();
  });
});
