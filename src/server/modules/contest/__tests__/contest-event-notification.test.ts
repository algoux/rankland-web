import { EventEmitter } from 'events';
import ContestEventNotificationCoordinator from '../contest-event-notification';
import ContestEventStreamService from '../contest-event-stream.service';
import { InMemoryContestEventStore } from '../contest-event-store.memory';
import { ContestStreamState } from '../contest-event-store';
import ContestSseHub from '../contest-sse-hub';
import type { ContestEventNotificationRedisCallbacks } from '../contest-event-notification.redis';
import type { ContestCommittedWatermark } from '../contest-event-watermark';

class FakeResponse extends EventEmitter {
  public readonly writes: string[] = [];
  public endCalls = 0;
  public destroyed = false;
  public writableEnded = false;
  public writableFinished = false;

  public write(chunk: string): boolean {
    this.writes.push(chunk);
    return true;
  }

  public end(): void {
    this.endCalls += 1;
    this.writableEnded = true;
  }
}

class ControlledStore extends InMemoryContestEventStore {
  public readonly streamReadQueue: Array<Promise<ContestStreamState>> = [];
  public readonly batchReadQueue: Array<Promise<ContestStreamState[]>> = [];
  public streamReadCalls = 0;
  public readonly batchReadCalls: string[][] = [];

  public override async getStreamState(uk: string): Promise<ContestStreamState> {
    this.streamReadCalls += 1;
    const controlled = this.streamReadQueue.shift();
    return controlled ? controlled : super.getStreamState(uk);
  }

  public override async getStreamStates(contestIds: readonly string[]): Promise<ContestStreamState[]> {
    this.batchReadCalls.push([...contestIds]);
    const controlled = this.batchReadQueue.shift();
    return controlled ? controlled : super.getStreamStates(contestIds);
  }
}

class FakeRedisAdapter {
  public callbacks?: ContestEventNotificationRedisCallbacks;
  public readonly published: ContestCommittedWatermark[] = [];
  public startCalls = 0;
  public stopCalls = 0;
  public publishImplementation: (watermark: ContestCommittedWatermark) => Promise<unknown> = async () => ({
    status: 'published',
    receiverCount: 1,
  });

  public async start(callbacks: ContestEventNotificationRedisCallbacks): Promise<void> {
    this.startCalls += 1;
    this.callbacks = callbacks;
  }

  public async publish(watermark: ContestCommittedWatermark): Promise<unknown> {
    this.published.push(watermark);
    return this.publishImplementation(watermark);
  }

  public async stop(): Promise<void> {
    this.stopCalls += 1;
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function state(
  lastEventId: number,
  streamRevision = 1,
  contestId = '70346717215600640',
  uk = 'contest-a',
): ContestStreamState {
  return { contestId, uk, lastEventId, streamRevision, producerId: null };
}

function frame(uk: string, latestEventId: number, streamRevision = 1) {
  return `event: events-available\ndata: ${JSON.stringify({ uk, latestEventId, streamRevision })}\n\n`;
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('ContestEventNotificationCoordinator', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('closes the read-register race with a second authoritative read', async () => {
    const store = new ControlledStore();
    const firstRead = deferred<ContestStreamState>();
    const secondRead = deferred<ContestStreamState>();
    store.streamReadQueue.push(firstRead.promise, secondRead.promise);
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      new ContestSseHub(),
    );
    const response = new FakeResponse();

    const attaching = coordinator.attachClient('Contest-A', response);
    firstRead.resolve(state(1));
    await flushPromises();
    expect(store.streamReadCalls).toBe(2);
    secondRead.resolve(state(4));
    await attaching;

    expect(response.writes).toEqual([frame('Contest-A', 4)]);
  });

  it('does not let a late initial snapshot overwrite a newer live notification', async () => {
    const store = new ControlledStore();
    const firstRead = deferred<ContestStreamState>();
    const secondRead = deferred<ContestStreamState>();
    store.streamReadQueue.push(firstRead.promise, secondRead.promise);
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      new ContestSseHub(),
    );
    const response = new FakeResponse();

    const attaching = coordinator.attachClient('Contest-A', response);
    firstRead.resolve(state(1));
    await flushPromises();
    await coordinator.announceCommitted({
      contestId: '70346717215600640',
      canonicalUk: 'contest-a',
      latestEventId: 5,
      streamRevision: 1,
    });
    secondRead.resolve(state(3));
    await attaching;

    expect(response.writes).toEqual([frame('Contest-A', 5)]);
  });

  it('notifies the local Hub before publishing and isolates both failure paths', async () => {
    const store = new ControlledStore();
    const hub = new ContestSseHub();
    const response = new FakeResponse();
    hub.addClient('1', 'contest-a', response);
    const redis = new FakeRedisAdapter();
    redis.publishImplementation = async () => {
      expect(response.writes).toEqual([frame('contest-a', 2)]);
      throw new Error('publish failed');
    };
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      hub,
      redis as any,
    );
    const committed = {
      contestId: '1',
      canonicalUk: 'contest-a',
      latestEventId: 2,
      streamRevision: 1,
    };

    await expect(coordinator.announceCommitted(committed)).resolves.toBeUndefined();
    expect(redis.published).toEqual([committed]);

    vi.spyOn(hub, 'notify').mockImplementationOnce(() => {
      throw new Error('local Hub failed');
    });
    redis.publishImplementation = async () => ({ status: 'published', receiverCount: 1 });
    await expect(coordinator.announceCommitted({ ...committed, latestEventId: 3 })).resolves.toBeUndefined();
    expect(redis.published).toHaveLength(2);
  });

  it('ends the response when either authoritative attach read fails', async () => {
    const firstFailureStore = new ControlledStore();
    firstFailureStore.streamReadQueue.push(Promise.reject(new Error('first read failed')));
    const firstFailureResponse = new FakeResponse();
    const firstCoordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(firstFailureStore),
      new ContestSseHub(),
    );

    await expect(firstCoordinator.attachClient('contest-a', firstFailureResponse)).resolves.toBeUndefined();
    expect(firstFailureResponse.endCalls).toBe(1);

    const secondFailureStore = new ControlledStore();
    secondFailureStore.streamReadQueue.push(Promise.resolve(state(1)), Promise.reject(new Error('second read failed')));
    const secondFailureResponse = new FakeResponse();
    const secondCoordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(secondFailureStore),
      new ContestSseHub(),
    );

    await expect(secondCoordinator.attachClient('contest-a', secondFailureResponse)).resolves.toBeUndefined();
    expect(secondFailureResponse.endCalls).toBe(1);
  });

  it('keeps a closed registration terminal while the second read is pending', async () => {
    const store = new ControlledStore();
    const secondRead = deferred<ContestStreamState>();
    store.streamReadQueue.push(Promise.resolve(state(1)), secondRead.promise);
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      new ContestSseHub(),
    );
    const response = new FakeResponse();

    const attaching = coordinator.attachClient('contest-a', response);
    await flushPromises();
    response.emit('close');
    secondRead.resolve(state(2));
    await attaching;

    expect(response.writes).toEqual([]);
    expect(response.endCalls).toBe(0);
  });

  it('does not register a client that closes while the first read is pending', async () => {
    const store = new ControlledStore();
    const firstRead = deferred<ContestStreamState>();
    store.streamReadQueue.push(firstRead.promise);
    const hub = new ContestSseHub();
    const coordinator = new ContestEventNotificationCoordinator(new ContestEventStreamService(store), hub);
    const response = new FakeResponse();

    const attaching = coordinator.attachClient('contest-a', response);
    response.emit('close');
    firstRead.resolve(state(1));
    await attaching;

    expect(response.writes).toEqual([]);
    expect(hub.getActiveContestIds()).toEqual([]);
    expect(store.streamReadCalls).toBe(1);
  });

  it('reconciles only active contests, notifies present states, and closes missing contests', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const store = new ControlledStore();
    store.batchReadQueue.push(Promise.resolve([state(8, 2, '1', 'contest-a')]));
    const hub = new ContestSseHub();
    const first = new FakeResponse();
    const missing = new FakeResponse();
    hub.addClient('1', 'Contest-A', first);
    hub.addClient('2', 'contest-b', missing);
    const coordinator = new ContestEventNotificationCoordinator(new ContestEventStreamService(store), hub);

    await coordinator.start();
    await vi.advanceTimersByTimeAsync(0);

    expect(store.batchReadCalls).toEqual([['1', '2']]);
    expect(first.writes).toEqual([frame('Contest-A', 8, 2)]);
    expect(missing.endCalls).toBe(1);
    await coordinator.stop();
  });

  it('starts Redis callbacks, reconciles immediately after subscribe ACK, and stops the adapter terminally', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    const store = new ControlledStore();
    store.batchReadQueue.push(Promise.resolve([state(4, 1, '1')]));
    const hub = new ContestSseHub();
    const response = new FakeResponse();
    hub.addClient('1', 'Contest-A', response);
    const redis = new FakeRedisAdapter();
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      hub,
      redis as any,
    );

    await coordinator.start();
    expect(redis.startCalls).toBe(1);
    await redis.callbacks?.onSubscribed();
    await flushPromises();
    expect(store.batchReadCalls).toEqual([['1']]);
    expect(response.writes).toEqual([frame('Contest-A', 4)]);

    await redis.callbacks?.onWatermark({
      contestId: '1',
      canonicalUk: 'contest-a',
      latestEventId: 5,
      streamRevision: 1,
    });
    await flushPromises();
    expect(response.writes).toEqual([frame('Contest-A', 4), frame('Contest-A', 5)]);

    const stopping = coordinator.stop();
    expect(redis.stopCalls).toBe(1);
    await stopping;
  });

  it('skips empty and overlapping reconciliation ticks, then retries on the next fixed-rate tick', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const store = new ControlledStore();
    const hub = new ContestSseHub();
    const coordinator = new ContestEventNotificationCoordinator(new ContestEventStreamService(store), hub);
    await coordinator.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(store.batchReadCalls).toEqual([]);

    hub.addClient('1', 'contest-a', new FakeResponse());
    const slowRead = deferred<ContestStreamState[]>();
    store.batchReadQueue.push(slowRead.promise, Promise.resolve([state(2, 1, '1')]));
    await vi.advanceTimersByTimeAsync(5_000);
    expect(store.batchReadCalls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(store.batchReadCalls).toHaveLength(1);

    slowRead.resolve([state(1, 1, '1')]);
    await flushPromises();
    await vi.advanceTimersByTimeAsync(5_000);
    expect(store.batchReadCalls).toHaveLength(2);
    await coordinator.stop();
  });

  it('keeps clients open after a failed reconciliation and recovers on the next tick', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const store = new ControlledStore();
    const failedRead = Promise.reject<ContestStreamState[]>(new Error('database unavailable'));
    failedRead.catch(() => undefined);
    store.batchReadQueue.push(failedRead, Promise.resolve([state(3, 1, '1')]));
    const hub = new ContestSseHub();
    const response = new FakeResponse();
    hub.addClient('1', 'contest-a', response);
    const coordinator = new ContestEventNotificationCoordinator(new ContestEventStreamService(store), hub);

    await coordinator.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(response.endCalls).toBe(0);
    expect(response.writes).toEqual([]);

    await vi.advanceTimersByTimeAsync(5_000);
    expect(response.writes).toEqual([frame('contest-a', 3)]);
    expect(response.endCalls).toBe(0);
    await coordinator.stop();
  });

  it('logs a new degradation immediately after a recovery starts a new rate-limit episode', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const firstFailure = Promise.reject<ContestStreamState[]>(new Error('first outage'));
    const secondFailure = Promise.reject<ContestStreamState[]>(new Error('second outage'));
    firstFailure.catch(() => undefined);
    secondFailure.catch(() => undefined);
    const store = new ControlledStore();
    store.batchReadQueue.push(firstFailure, Promise.resolve([state(1, 1, '1')]), secondFailure);
    const hub = new ContestSseHub();
    hub.addClient('1', 'contest-a', new FakeResponse());
    const coordinator = new ContestEventNotificationCoordinator(new ContestEventStreamService(store), hub);

    await coordinator.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(5_000);
    await vi.advanceTimersByTimeAsync(5_000);

    expect(warn.mock.calls.filter(([event]) => event === 'contest_event_notification.reconcile_failed')).toHaveLength(
      2,
    );
    await coordinator.stop();
  });

  it('stops timers and clients synchronously so late reads cannot write or revive them', async () => {
    const store = new ControlledStore();
    const secondRead = deferred<ContestStreamState>();
    store.streamReadQueue.push(Promise.resolve(state(1)), secondRead.promise);
    const hub = new ContestSseHub();
    const coordinator = new ContestEventNotificationCoordinator(new ContestEventStreamService(store), hub);
    const response = new FakeResponse();
    const attaching = coordinator.attachClient('contest-a', response);
    await flushPromises();

    const stopping = coordinator.stop();
    expect(response.endCalls).toBe(1);
    secondRead.resolve(state(3));
    await attaching;
    await stopping;
    expect(response.writes).toEqual([]);

    const late = new FakeResponse();
    await coordinator.attachClient('contest-a', late);
    expect(late.endCalls).toBe(1);
    expect(store.streamReadCalls).toBe(2);
  });

  it('ignores a reconciliation rejection that arrives after stop', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const lateRead = deferred<ContestStreamState[]>();
    const store = new ControlledStore();
    store.batchReadQueue.push(lateRead.promise);
    const hub = new ContestSseHub();
    hub.addClient('1', 'contest-a', new FakeResponse());
    const coordinator = new ContestEventNotificationCoordinator(new ContestEventStreamService(store), hub);

    await coordinator.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(store.batchReadCalls).toHaveLength(1);
    await coordinator.stop();
    lateRead.reject(new Error('database closed during shutdown'));
    await flushPromises();

    expect(warn.mock.calls.some(([event]) => event === 'contest_event_notification.reconcile_failed')).toBe(false);
  });
});
