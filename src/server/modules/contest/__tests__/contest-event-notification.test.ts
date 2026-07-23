import { EventEmitter } from 'events';
import ContestEventNotificationCoordinator from '../contest-event-notification';
import ContestEventStreamService from '../contest-event-stream.service';
import { InMemoryContestEventStore } from '../contest-event-store.memory';
import { ContestEventAuthorityState, ContestStreamState } from '../contest-event-store';
import ContestSseHub from '../contest-sse-hub';
import type { ContestEventNotificationRedisCallbacks } from '../contest-event-notification.redis';
import type { ContestCommittedWatermark } from '../contest-event-watermark';
import { ContestEventReadPoolAcquisitionUnavailableError } from '../contest-event-read-db-deadline';

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

  public override emit(eventName: string | symbol, ...args: any[]): boolean {
    if (eventName === 'close') this.destroyed = true;
    if (eventName === 'finish') this.writableFinished = true;
    return super.emit(eventName, ...args);
  }
}

class ControlledStore extends InMemoryContestEventStore {
  public readonly streamReadQueue: Array<Promise<ContestStreamState>> = [];
  public readonly streamBatchReadQueue: Array<Promise<ContestStreamState[]>> = [];
  public readonly batchReadQueue: Array<Promise<ContestStreamState[]>> = [];
  public streamReadCalls = 0;
  public readonly streamBatchReadCalls: string[][] = [];
  public readonly batchReadCalls: string[][] = [];

  public override async getStreamState(uk: string): Promise<ContestStreamState> {
    this.streamReadCalls += 1;
    const controlled = this.streamReadQueue.shift();
    return controlled ? controlled : super.getStreamState(uk);
  }

  public override async getStreamStates(contestIds: readonly string[]): Promise<ContestStreamState[]> {
    this.streamBatchReadCalls.push([...contestIds]);
    const controlled = this.streamBatchReadQueue.shift();
    return controlled ? controlled : super.getStreamStates(contestIds);
  }

  public override async readAuthorityByContestIds(
    contestIds: readonly string[],
  ): Promise<ContestEventAuthorityState[]> {
    this.batchReadCalls.push([...contestIds]);
    const controlled = this.batchReadQueue.shift();
    if (!controlled) {
      return super.readAuthorityByContestIds(contestIds);
    }
    return (await controlled).map((item) => ({
      contestId: item.contestId,
      canonicalUk: item.uk,
      streamRevision: item.streamRevision,
      lastEventId: item.lastEventId,
      frozenStartNs: null,
      visibilityFingerprint: 'duration=18000;frozen=null',
    }));
  }
}

class FakeRedisAdapter {
  public callbacks?: ContestEventNotificationRedisCallbacks;
  public readonly published: ContestCommittedWatermark[] = [];
  public readonly publishedControls: unknown[] = [];
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

  public async publishControl(control: unknown): Promise<unknown> {
    this.publishedControls.push(control);
    return { status: 'published', receiverCount: 1 };
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

const synchronousNotificationEnvironment = {
  CONTEST_EVENT_NOTIFICATION_COALESCE_WINDOW_MS: '0',
  CONTEST_EVENT_NOTIFICATION_FANOUT_SHARDS: '1',
  CONTEST_EVENT_NOTIFICATION_FANOUT_WINDOW_MS: '0',
} as const;
type SynchronousNotificationEnvironmentKey = keyof typeof synchronousNotificationEnvironment;

describe('ContestEventNotificationCoordinator', () => {
  let originalNotificationEnvironment: Record<SynchronousNotificationEnvironmentKey, string | undefined>;

  beforeEach(() => {
    originalNotificationEnvironment = Object.fromEntries(
      Object.keys(synchronousNotificationEnvironment).map((key) => [key, process.env[key]]),
    ) as Record<SynchronousNotificationEnvironmentKey, string | undefined>;
    Object.assign(process.env, synchronousNotificationEnvironment);
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(originalNotificationEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('closes the read-register race with a second authoritative read', async () => {
    const store = new ControlledStore();
    const firstRead = deferred<ContestStreamState>();
    const secondRead = deferred<ContestStreamState[]>();
    store.streamReadQueue.push(firstRead.promise);
    store.streamBatchReadQueue.push(secondRead.promise);
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      new ContestSseHub(),
    );
    const response = new FakeResponse();

    const attaching = coordinator.attachClient('Contest-A', response);
    firstRead.resolve(state(1));
    await vi.waitFor(() => expect(store.streamBatchReadCalls).toEqual([['70346717215600640']]));
    secondRead.resolve([state(4)]);
    await attaching;

    expect(response.writes).toEqual([frame('Contest-A', 4)]);
  });

  it('coalesces concurrent attachment identity reads and closes their registration gap with one batch read', async () => {
    const store = new ControlledStore();
    const firstRead = deferred<ContestStreamState>();
    const identityRead = vi.spyOn(store, 'getStreamState').mockImplementation(() => firstRead.promise);
    const service = new ContestEventStreamService(store);
    const postRegistrationRead = vi.spyOn(service, 'getAuthoritativeStreamStates').mockResolvedValue([state(4)]);
    const coordinator = new ContestEventNotificationCoordinator(service, new ContestSseHub());
    const responses = Array.from({ length: 100 }, () => new FakeResponse());

    const attachments = responses.map((response) => coordinator.attachClient('Contest-A', response));
    await flushPromises();
    expect(identityRead).toHaveBeenCalledOnce();
    firstRead.resolve(state(4));
    await Promise.all(attachments);

    expect(identityRead).toHaveBeenCalledOnce();
    expect(postRegistrationRead).toHaveBeenCalledOnce();
    expect(postRegistrationRead).toHaveBeenCalledWith(['70346717215600640']);
    for (const response of responses) {
      expect(response.writes).toEqual([frame('Contest-A', 4)]);
    }
  });

  it('uses one post-registration batch read across multiple contests', async () => {
    const store = new ControlledStore();
    vi.spyOn(store, 'getStreamState').mockImplementation(async (uk) =>
      uk.toLocaleLowerCase('en-US') === 'contest-a' ? state(4, 1, '1', 'contest-a') : state(7, 2, '2', 'contest-b'),
    );
    const batchRead = vi
      .spyOn(store, 'getStreamStates')
      .mockResolvedValue([state(4, 1, '1', 'contest-a'), state(7, 2, '2', 'contest-b')]);
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      new ContestSseHub(),
    );
    const first = new FakeResponse();
    const second = new FakeResponse();

    await Promise.all([coordinator.attachClient('Contest-A', first), coordinator.attachClient('Contest-B', second)]);

    expect(batchRead).toHaveBeenCalledOnce();
    expect(new Set(batchRead.mock.calls[0][0])).toEqual(new Set(['1', '2']));
    expect(first.writes).toEqual([frame('Contest-A', 4)]);
    expect(second.writes).toEqual([frame('Contest-B', 7, 2)]);
  });

  it('can disable bootstrap coalescing for same-image A/B validation', async () => {
    const store = new ControlledStore();
    const streamRead = vi.spyOn(store, 'getStreamState').mockResolvedValue(state(4));
    const service = new ContestEventStreamService(store, undefined, {
      bootstrapAuthorityCoalescingEnabled: false,
    });
    const postRegistrationRead = vi.spyOn(service, 'getFreshAuthoritativeStreamState');
    const coordinator = new ContestEventNotificationCoordinator(service, new ContestSseHub(), undefined, undefined, {
      bootstrapAuthorityCoalescingEnabled: false,
    });
    const responses = Array.from({ length: 3 }, () => new FakeResponse());

    await Promise.all(responses.map((response) => coordinator.attachClient('Contest-A', response)));

    expect(streamRead).toHaveBeenCalledTimes(6);
    expect(postRegistrationRead).toHaveBeenCalledTimes(3);
    for (const response of responses) {
      expect(response.writes).toEqual([frame('Contest-A', 4)]);
    }
  });

  it('does not let a late initial snapshot overwrite a newer live notification', async () => {
    const store = new ControlledStore();
    const firstRead = deferred<ContestStreamState>();
    const secondRead = deferred<ContestStreamState[]>();
    store.streamReadQueue.push(firstRead.promise);
    store.streamBatchReadQueue.push(secondRead.promise);
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      new ContestSseHub(),
    );
    const response = new FakeResponse();

    const attaching = coordinator.attachClient('Contest-A', response);
    firstRead.resolve(state(1));
    await vi.waitFor(() => expect(store.streamBatchReadCalls).toHaveLength(1));
    await coordinator.announceCommitted({
      contestId: '70346717215600640',
      canonicalUk: 'contest-a',
      latestEventId: 5,
      streamRevision: 1,
    });
    secondRead.resolve([state(3)]);
    await attaching;

    expect(response.writes).toEqual([frame('Contest-A', 5)]);
  });

  it('updates the local cache before notifying the Hub and publishing to Redis', async () => {
    const store = new ControlledStore();
    const hub = new ContestSseHub();
    const response = new FakeResponse();
    hub.addClient('1', 'contest-a', response);
    const order: string[] = [];
    const originalNotify = hub.notify.bind(hub);
    vi.spyOn(hub, 'notify').mockImplementation((watermark) => {
      order.push('hub');
      originalNotify(watermark);
    });
    const redis = new FakeRedisAdapter();
    redis.publishImplementation = async () => {
      order.push('redis');
      expect(response.writes).toEqual([frame('contest-a', 2)]);
      throw new Error('publish failed');
    };
    const readCache = {
      observeCommittedAppend: vi.fn(() => order.push('cache')),
      observeWatermark: vi.fn(() => order.push('cache')),
      invalidate: vi.fn(),
    };
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      hub,
      redis as any,
      readCache as any,
    );
    const committed = {
      contestId: '1',
      canonicalUk: 'contest-a',
      latestEventId: 2,
      streamRevision: 1,
    };

    await expect(coordinator.announceCommitted(committed, [{} as any])).resolves.toBeUndefined();
    expect(order).toEqual(['cache', 'hub', 'redis']);
    expect(redis.published).toEqual([committed]);

    order.length = 0;
    vi.spyOn(hub, 'notify').mockImplementationOnce(() => {
      order.push('hub');
      throw new Error('local Hub failed');
    });
    redis.publishImplementation = async () => {
      order.push('redis');
      return { status: 'published', receiverCount: 1 };
    };
    await expect(coordinator.announceCommitted({ ...committed, latestEventId: 3 })).resolves.toBeUndefined();
    expect(order).toEqual(['cache', 'hub', 'redis']);
    expect(redis.published).toHaveLength(2);
  });

  it('publishes to Redis without waiting for a scheduled local fanout cycle', async () => {
    vi.useFakeTimers();
    const hub = new ContestSseHub({
      coalesceWindowMs: 25,
      fanoutShards: 8,
      fanoutWindowMs: 100,
      summaryIntervalMs: 60_000,
    });
    const response = new FakeResponse();
    hub.addClient('1', 'contest-a', response);
    const redis = new FakeRedisAdapter();
    redis.publishImplementation = async () => {
      expect(response.writes).toEqual([]);
      return { status: 'published', receiverCount: 4 };
    };
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(new ControlledStore()),
      hub,
      redis as any,
    );
    const committed = {
      contestId: '1',
      canonicalUk: 'contest-a',
      latestEventId: 2,
      streamRevision: 1,
    };

    await coordinator.announceCommitted(committed);

    expect(redis.published).toEqual([committed]);
    expect(response.writes).toEqual([]);
    vi.advanceTimersByTime(25);
    expect(response.writes).toEqual([frame('contest-a', 2)]);
  });

  it('keeps committed notification delivery fail-open when cache update and fail-close both throw', async () => {
    const store = new ControlledStore();
    const hub = new ContestSseHub();
    const response = new FakeResponse();
    hub.addClient('1', 'contest-a', response);
    const redis = new FakeRedisAdapter();
    const readCache = {
      observeCommittedAppend: vi.fn(() => {
        throw new Error('cache update failed');
      }),
      observeWatermark: vi.fn(),
      invalidate: vi.fn(() => {
        throw new Error('cache fail-close failed');
      }),
      disableContest: vi.fn(),
    };
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      hub,
      redis as any,
      readCache as any,
    );
    const committed = {
      contestId: '1',
      canonicalUk: 'contest-a',
      latestEventId: 2,
      streamRevision: 1,
    };

    await expect(coordinator.announceCommitted(committed, [{} as any])).resolves.toBeUndefined();
    expect(response.writes).toEqual([frame('contest-a', 2)]);
    expect(redis.published).toEqual([committed]);
    expect(readCache.invalidate).toHaveBeenCalledOnce();
    expect(readCache.disableContest).toHaveBeenCalledWith('1');
  });

  it('continues publishing a committed delete control when local Hub closure throws', async () => {
    const store = new ControlledStore();
    const hub = new ContestSseHub();
    vi.spyOn(hub, 'closeContest').mockImplementation(() => {
      throw new Error('local Hub close failed');
    });
    const redis = new FakeRedisAdapter();
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      hub,
      redis as any,
      { invalidate: vi.fn() } as any,
    );
    const control = { type: 'delete' as const, contestId: '1', canonicalUk: 'contest-a' };

    await expect(coordinator.announceControl(control)).resolves.toBeUndefined();
    expect(redis.publishedControls).toEqual([control]);
  });

  it('keeps a received delete control terminal when local Hub closure throws', async () => {
    const store = new ControlledStore();
    const hub = new ContestSseHub();
    vi.spyOn(hub, 'closeContest').mockImplementation(() => {
      throw new Error('local Hub close failed');
    });
    const redis = new FakeRedisAdapter();
    const readCache = {
      invalidate: vi.fn(),
      start: vi.fn(),
      getActiveContestIds: vi.fn(() => []),
      dispose: vi.fn(),
    };
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      hub,
      redis as any,
      readCache as any,
    );
    await coordinator.start();
    const control = { type: 'delete' as const, contestId: '1', canonicalUk: 'contest-a' };

    expect(() => redis.callbacks?.onControl?.(control)).not.toThrow();
    expect(readCache.invalidate).toHaveBeenCalledWith(control);
    await coordinator.stop();
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
    secondFailureStore.streamReadQueue.push(Promise.resolve(state(1)));
    secondFailureStore.streamBatchReadQueue.push(Promise.reject(new Error('second read failed')));
    const secondFailureResponse = new FakeResponse();
    const secondCoordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(secondFailureStore),
      new ContestSseHub(),
    );

    await expect(secondCoordinator.attachClient('contest-a', secondFailureResponse)).resolves.toBeUndefined();
    expect(secondFailureResponse.endCalls).toBe(1);
  });

  it('keeps the response uncommitted and returns retryable 503 when prepared bootstrap exhausts the pool', async () => {
    const store = new ControlledStore();
    store.streamReadQueue.push(Promise.resolve(state(1)));
    store.streamBatchReadQueue.push(
      Promise.reject(new ContestEventReadPoolAcquisitionUnavailableError(new Error('No connections available.'))),
    );
    const hub = new ContestSseHub();
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store, undefined, { retryAfterSeconds: 2 }),
      hub,
    );
    const response = new FakeResponse();

    await expect(coordinator.prepareClient('contest-a', response)).rejects.toMatchObject({
      code: 503,
      headers: { 'Retry-After': '2' },
    });
    expect(response.writes).toEqual([]);
    expect(response.endCalls).toBe(0);
    expect(hub.getActiveContestIds()).toEqual([]);
  });

  it('returns retryable 503 when the coordinator or hub is no longer accepting new attachments', async () => {
    const stopped = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(new ControlledStore()),
      new ContestSseHub(),
      undefined,
      undefined,
      { retryAfterSeconds: 2 },
    );
    await stopped.stop();
    await expect(stopped.prepareClient('contest-a', new FakeResponse())).rejects.toMatchObject({
      code: 503,
      headers: { 'Retry-After': '2' },
    });

    const store = new ControlledStore();
    store.streamReadQueue.push(Promise.resolve(state(1)));
    const drainingHub = new ContestSseHub();
    drainingHub.beginDraining();
    const draining = new ContestEventNotificationCoordinator(new ContestEventStreamService(store), drainingHub);
    await expect(draining.prepareClient('contest-a', new FakeResponse())).rejects.toMatchObject({
      code: 503,
      headers: { 'Retry-After': '1' },
    });
  });

  it('returns retryable 503 when contest identity changes during an uncoalesced attachment', async () => {
    const store = new ControlledStore();
    store.streamReadQueue.push(Promise.resolve(state(1)), Promise.resolve(state(1, 1, '2')));
    const service = new ContestEventStreamService(store, undefined, {
      bootstrapAuthorityCoalescingEnabled: false,
    });
    const coordinator = new ContestEventNotificationCoordinator(service, new ContestSseHub(), undefined, undefined, {
      bootstrapAuthorityCoalescingEnabled: false,
    });

    await expect(coordinator.prepareClient('contest-a', new FakeResponse())).rejects.toMatchObject({
      code: 503,
      headers: { 'Retry-After': '1' },
    });
  });

  it('returns retryable 503 when a coalesced second read observes a UK remap', async () => {
    const store = new ControlledStore();
    store.streamReadQueue.push(Promise.resolve(state(1)));
    store.streamBatchReadQueue.push(Promise.resolve([state(1, 1, '70346717215600640', 'contest-b')]));
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      new ContestSseHub(),
    );

    await expect(coordinator.prepareClient('Contest-A', new FakeResponse())).rejects.toMatchObject({
      code: 503,
      headers: { 'Retry-After': '1' },
    });
  });

  it('accepts a request UK variant when both authority reads return the same canonical UK', async () => {
    const store = new ControlledStore();
    store.streamReadQueue.push(Promise.resolve(state(1, 1, '70346717215600640', 'résumé')));
    store.streamBatchReadQueue.push(Promise.resolve([state(2, 1, '70346717215600640', 'résumé')]));
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      new ContestSseHub(),
    );
    const response = new FakeResponse();

    const prepared = await coordinator.prepareClient('resume', response);
    prepared.activate();

    expect(response.writes).toEqual([frame('resume', 2)]);
  });

  it('keeps the response uncommitted and returns 503 when stop wins the first authority read', async () => {
    const store = new ControlledStore();
    const firstRead = deferred<ContestStreamState>();
    store.streamReadQueue.push(firstRead.promise);
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      new ContestSseHub(),
    );
    const response = new FakeResponse();

    const preparing = coordinator.prepareClient('contest-a', response);
    await coordinator.stop();
    firstRead.resolve(state(1));

    await expect(preparing).rejects.toMatchObject({ code: 503, headers: { 'Retry-After': '1' } });
    expect(response.endCalls).toBe(0);
    expect(response.writes).toEqual([]);
  });

  it('keeps the response uncommitted and returns 503 when stop wins the second authority read', async () => {
    const store = new ControlledStore();
    const secondRead = deferred<ContestStreamState[]>();
    store.streamReadQueue.push(Promise.resolve(state(1)));
    store.streamBatchReadQueue.push(secondRead.promise);
    const hub = new ContestSseHub();
    const coordinator = new ContestEventNotificationCoordinator(new ContestEventStreamService(store), hub);
    const response = new FakeResponse();

    const preparing = coordinator.prepareClient('contest-a', response);
    await vi.waitFor(() => expect(store.streamBatchReadCalls).toHaveLength(1));
    await coordinator.stop();
    secondRead.resolve([state(1)]);

    await expect(preparing).rejects.toMatchObject({ code: 503, headers: { 'Retry-After': '1' } });
    expect(response.endCalls).toBe(0);
    expect(response.writes).toEqual([]);
    expect(hub.getActiveContestIds()).toEqual([]);
  });

  it('silently returns a closed attachment when the client disconnects during the first authority read', async () => {
    const store = new ControlledStore();
    const firstRead = deferred<ContestStreamState>();
    store.streamReadQueue.push(firstRead.promise);
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      new ContestSseHub(),
    );
    const response = new FakeResponse();

    const preparing = coordinator.prepareClient('contest-a', response);
    response.emit('close');
    firstRead.resolve(state(1));

    await expect(preparing).resolves.toMatchObject({ closed: true });
  });

  it('keeps a closed registration terminal while the second read is pending', async () => {
    const store = new ControlledStore();
    const secondRead = deferred<ContestStreamState[]>();
    store.streamReadQueue.push(Promise.resolve(state(1)));
    store.streamBatchReadQueue.push(secondRead.promise);
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      new ContestSseHub(),
    );
    const response = new FakeResponse();

    const attaching = coordinator.attachClient('contest-a', response);
    await vi.waitFor(() => expect(store.streamBatchReadCalls).toHaveLength(1));
    response.emit('close');
    secondRead.resolve([state(2)]);
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

  it('materializes reconciliation watermarks before SSE fanout', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const store = new ControlledStore();
    store.batchReadQueue.push(Promise.resolve([state(8, 1, '1', 'contest-a')]));
    const hub = new ContestSseHub();
    const response = new FakeResponse();
    hub.addClient('1', 'Contest-A', response);
    const fill = deferred<boolean>();
    const readCache = {
      start: vi.fn(),
      dispose: vi.fn(),
      getActiveContestIds: vi.fn(() => []),
      beginCalibration: vi.fn(() => ({})),
      calibrate: vi.fn(),
      materializeObservedWatermark: vi.fn(() => fill.promise),
    };
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      hub,
      undefined,
      readCache as any,
      {
        mode: 'on',
        hotAuthorityRefreshMs: 3_000,
        reconciliationMaxMs: 5_000,
        eagerTailFillEnabled: true,
        eagerNotifyWaitMs: 250,
      },
    );

    await coordinator.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(readCache.materializeObservedWatermark).toHaveBeenCalledWith({
      contestId: '1',
      canonicalUk: 'contest-a',
      latestEventId: 8,
      streamRevision: 1,
    });
    expect(response.writes).toEqual([]);
    fill.resolve(true);
    await vi.advanceTimersByTimeAsync(0);
    await vi.waitFor(() => expect(response.writes).toHaveLength(1));

    expect(response.writes).toEqual([frame('Contest-A', 8)]);
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
    const readCache = {
      observeWatermark: vi.fn(),
      observeCommittedAppend: vi.fn(),
      start: vi.fn(),
      invalidate: vi.fn(),
      calibrate: vi.fn(),
      beginCalibration: vi.fn(() => ({})),
      getActiveContestIds: vi.fn(() => []),
      dispose: vi.fn(),
    };
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      hub,
      redis as any,
      readCache as any,
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
    expect(readCache.observeWatermark).toHaveBeenCalledWith({
      contestId: '1',
      canonicalUk: 'contest-a',
      latestEventId: 5,
      streamRevision: 1,
    });

    await redis.callbacks?.onControl?.({
      type: 'metadata',
      contestId: '1',
      canonicalUk: 'contest-a',
      visibilityFingerprint: 'duration=18000;frozen=3600',
    });
    expect(readCache.invalidate).toHaveBeenCalledWith({
      type: 'metadata',
      contestId: '1',
      canonicalUk: 'contest-a',
      visibilityFingerprint: 'duration=18000;frozen=3600',
    });

    const stopping = coordinator.stop();
    expect(redis.stopCalls).toBe(1);
    expect(readCache.dispose).toHaveBeenCalledOnce();
    await stopping;
  });

  it('materializes a remote watermark for an active contest before notifying SSE clients', async () => {
    const store = new ControlledStore();
    const hub = new ContestSseHub();
    const response = new FakeResponse();
    hub.addClient('1', 'Contest-A', response);
    const redis = new FakeRedisAdapter();
    const fill = deferred<boolean>();
    const order: string[] = [];
    const readCache = {
      start: vi.fn(),
      dispose: vi.fn(),
      getActiveContestIds: vi.fn(() => []),
      beginCalibration: vi.fn(() => ({})),
      calibrate: vi.fn(),
      observeWatermark: vi.fn(() => order.push('observe')),
      materializeObservedWatermark: vi.fn(async () => {
        order.push('fill-start');
        const result = await fill.promise;
        order.push('fill-complete');
        return result;
      }),
      invalidate: vi.fn(),
    };
    const originalNotify = hub.notify.bind(hub);
    vi.spyOn(hub, 'notify').mockImplementation((watermark) => {
      order.push('notify');
      originalNotify(watermark);
    });
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      hub,
      redis as any,
      readCache as any,
      { mode: 'on', eagerTailFillEnabled: true, eagerNotifyWaitMs: 250 } as any,
    );
    await coordinator.start();
    const watermark = { contestId: '1', canonicalUk: 'contest-a', latestEventId: 5, streamRevision: 1 };

    const notifying = redis.callbacks?.onWatermark(watermark);
    await flushPromises();
    expect(order).toEqual(['observe', 'fill-start']);
    expect(response.writes).toEqual([]);
    fill.resolve(true);
    await notifying;

    expect(order).toEqual(['observe', 'fill-start', 'fill-complete', 'notify']);
    expect(response.writes).toEqual([frame('Contest-A', 5)]);
    await coordinator.stop();
  });

  it('skips remote eager tail-fill when the contest has no active SSE clients', async () => {
    const redis = new FakeRedisAdapter();
    const readCache = {
      start: vi.fn(),
      dispose: vi.fn(),
      getActiveContestIds: vi.fn(() => []),
      beginCalibration: vi.fn(() => ({})),
      calibrate: vi.fn(),
      observeWatermark: vi.fn(),
      materializeObservedWatermark: vi.fn(async () => true),
      invalidate: vi.fn(),
    };
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(new ControlledStore()),
      new ContestSseHub(),
      redis as any,
      readCache as any,
      { mode: 'on', eagerTailFillEnabled: true, eagerNotifyWaitMs: 250 } as any,
    );
    await coordinator.start();

    await redis.callbacks?.onWatermark({
      contestId: '1',
      canonicalUk: 'contest-a',
      latestEventId: 5,
      streamRevision: 1,
    });

    expect(readCache.observeWatermark).toHaveBeenCalledOnce();
    expect(readCache.materializeObservedWatermark).not.toHaveBeenCalled();
    await coordinator.stop();
  });

  it('notifies after eager tail-fill rejects or exceeds its wait budget', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    const store = new ControlledStore();
    const hub = new ContestSseHub();
    const response = new FakeResponse();
    hub.addClient('1', 'contest-a', response);
    const redis = new FakeRedisAdapter();
    const never = deferred<boolean>();
    const readCache = {
      start: vi.fn(),
      dispose: vi.fn(),
      getActiveContestIds: vi.fn(() => []),
      beginCalibration: vi.fn(() => ({})),
      calibrate: vi.fn(),
      observeWatermark: vi.fn(),
      materializeObservedWatermark: vi
        .fn()
        .mockRejectedValueOnce(new Error('fill failed'))
        .mockImplementationOnce(() => never.promise),
      invalidate: vi.fn(),
    };
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      hub,
      redis as any,
      readCache as any,
      { mode: 'on', eagerTailFillEnabled: true, eagerNotifyWaitMs: 10 } as any,
    );
    await coordinator.start();
    const first = { contestId: '1', canonicalUk: 'contest-a', latestEventId: 5, streamRevision: 1 };
    const second = { ...first, latestEventId: 6 };

    await redis.callbacks?.onWatermark(first);
    expect(response.writes).toEqual([frame('contest-a', 5)]);
    const timed = redis.callbacks?.onWatermark(second);
    await flushPromises();
    expect(response.writes).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(10);
    await timed;

    expect(response.writes).toEqual([frame('contest-a', 5), frame('contest-a', 6)]);
    await coordinator.stop();
    never.resolve(true);
  });

  it('does not notify a remote watermark after stop wins the eager wait race', async () => {
    const store = new ControlledStore();
    const hub = new ContestSseHub();
    const response = new FakeResponse();
    hub.addClient('1', 'contest-a', response);
    const redis = new FakeRedisAdapter();
    const fill = deferred<boolean>();
    const readCache = {
      start: vi.fn(),
      dispose: vi.fn(),
      getActiveContestIds: vi.fn(() => []),
      beginCalibration: vi.fn(() => ({})),
      calibrate: vi.fn(),
      observeWatermark: vi.fn(),
      materializeObservedWatermark: vi.fn(() => fill.promise),
      invalidate: vi.fn(),
    };
    const coordinator = new ContestEventNotificationCoordinator(
      new ContestEventStreamService(store),
      hub,
      redis as any,
      readCache as any,
      { mode: 'on', eagerTailFillEnabled: true, eagerNotifyWaitMs: 250 } as any,
    );
    await coordinator.start();

    const notifying = redis.callbacks?.onWatermark({
      contestId: '1',
      canonicalUk: 'contest-a',
      latestEventId: 5,
      streamRevision: 1,
    });
    await flushPromises();
    await coordinator.stop();
    fill.resolve(true);
    await notifying;

    expect(response.writes).toEqual([]);
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
    const secondRead = deferred<ContestStreamState[]>();
    store.streamReadQueue.push(Promise.resolve(state(1)));
    store.streamBatchReadQueue.push(secondRead.promise);
    const hub = new ContestSseHub();
    const coordinator = new ContestEventNotificationCoordinator(new ContestEventStreamService(store), hub);
    const response = new FakeResponse();
    const attaching = coordinator.attachClient('contest-a', response);
    await flushPromises();

    const stopping = coordinator.stop();
    expect(response.endCalls).toBe(0);
    secondRead.resolve([state(3)]);
    await attaching;
    await stopping;
    expect(response.writes).toEqual([]);
    expect(response.endCalls).toBe(1);

    const late = new FakeResponse();
    await coordinator.attachClient('contest-a', late);
    expect(late.endCalls).toBe(1);
    expect(store.streamReadCalls).toBe(1);
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
