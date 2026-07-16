import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import Redis, { type RedisOptions } from 'ioredis';
import RedisConfig from '@server/configs/redis/redis.config';
import ContestEventNotificationCoordinator from '../contest-event-notification';
import ContestEventNotificationRedisAdapter, {
  buildContestEventNotificationChannel,
} from '../contest-event-notification.redis';
import { InMemoryContestEventStore } from '../contest-event-store.memory';
import ContestEventStreamService from '../contest-event-stream.service';
import type { ContestCommittedWatermark } from '../contest-event-watermark';
import ContestSseHub from '../contest-sse-hub';

const runRedisTests = process.env.RUN_REDIS_TESTS === 'true';
const contestId = '70346717215600640';
const canonicalUk = 'contest-a';
const requestUk = 'Contest-A';
const adapterListenerEvents = ['ready', 'message', 'error', 'close', 'end'] as const;

class RecordingResponse extends EventEmitter {
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

interface LogicalInstance {
  adapter: ContestEventNotificationRedisAdapter;
  coordinator: ContestEventNotificationCoordinator;
  publisher: Redis;
  subscriber: Redis;
  subscriberListenerBaseline: Record<(typeof adapterListenerEvents)[number], number>;
}

describe.runIf(runRedisTests)('contest event notification with real Redis', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fans out across instances, reconciles a missed signal, and rejects a stale revision', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);

    const namespace = `${process.env.REDIS_NAMESPACE || 'rankland:test'}:vitest:${process.pid}:${randomUUID()}`;
    const config = redisConfig(namespace);
    const store = new InMemoryContestEventStore();
    store.addContest(canonicalUk, { contestId });
    const instanceA = createLogicalInstance('a', config, store);
    const instanceB = createLogicalInstance('b', config, store);
    const response = new RecordingResponse();
    let coordinatorsStopped = false;

    try {
      await Promise.all([instanceA.publisher.connect(), instanceB.publisher.connect()]);
      await instanceB.coordinator.attachClient(requestUk, response);
      expect(eventFrames(response)).toEqual([frame(0, 1)]);

      await Promise.all([instanceA.coordinator.start(), instanceB.coordinator.start()]);
      await waitFor(
        () => instanceA.adapter.getState() === 'subscribed' && instanceB.adapter.getState() === 'subscribed',
        3_000,
        'both Redis adapters to receive SUBSCRIBE ACKs',
      );

      const channel = buildContestEventNotificationChannel(namespace);
      await waitForAsync(
        async () => (await redisSubscriberCount(instanceA.publisher, channel)) === 2,
        2_000,
        'Redis to report both adapter subscriptions',
      );

      const first = watermark(1, 1);
      await setAuthoritativeWatermark(store, first);
      const fanOutStartedAt = Date.now();
      await instanceA.coordinator.announceCommitted(first);
      await waitFor(
        () => eventFrames(response).includes(frame(1, 1)),
        1_000,
        'instance B to receive instance A notification',
      );
      expect(Date.now() - fanOutStartedAt).toBeLessThanOrEqual(1_000);

      const reset = watermark(0, 2);
      await setAuthoritativeWatermark(store, reset);
      await instanceA.coordinator.announceCommitted(reset);
      await waitFor(
        () => eventFrames(response).includes(frame(0, 2)),
        1_000,
        'instance B to receive the reset watermark',
      );

      const stale = watermark(999, 1);
      await instanceA.coordinator.announceCommitted(stale);
      await instanceA.coordinator.announceCommitted(stale);

      const orderedAfterStale = watermark(1, 2);
      await setAuthoritativeWatermark(store, orderedAfterStale);
      await instanceA.coordinator.announceCommitted(orderedAfterStale);
      await waitFor(
        () => eventFrames(response).includes(frame(1, 2)),
        1_000,
        'a later current-revision watermark to pass the stale-message barrier',
      );
      expect(eventFrames(response)).toEqual([frame(0, 1), frame(1, 1), frame(0, 2), frame(1, 2)]);

      await instanceB.adapter.stop();
      expect(instanceB.adapter.getState()).toBe('stopped');
      await waitForAsync(
        async () => (await redisSubscriberCount(instanceA.publisher, channel)) === 1,
        2_000,
        'Redis to remove instance B subscription',
      );

      const missed = watermark(2, 2);
      const missedAt = Date.now();
      await setAuthoritativeWatermark(store, missed);
      const publishResult = await instanceA.adapter.publish(missed);
      expect(publishResult).toEqual({ status: 'published', receiverCount: 1 });
      await waitFor(
        () => eventFrames(response).includes(frame(2, 2)),
        6_000,
        'instance B periodic reconcile to recover the missed signal',
      );
      expect(Date.now() - missedAt).toBeLessThanOrEqual(6_000);
      expect(eventFrames(response)).toEqual([frame(0, 1), frame(1, 1), frame(0, 2), frame(1, 2), frame(2, 2)]);

      await Promise.all([instanceA.coordinator.stop(), instanceB.coordinator.stop()]);
      coordinatorsStopped = true;
      await waitForAsync(
        async () => (await redisSubscriberCount(instanceA.publisher, channel)) === 0,
        2_000,
        'Redis to remove all adapter subscriptions during shutdown',
      );
      expect(response.endCalls).toBe(1);
      expect(response.eventNames()).toEqual([]);
      expectAdapterListenersRestored(instanceA);
      expectAdapterListenersRestored(instanceB);
    } finally {
      if (!coordinatorsStopped) {
        await Promise.allSettled([instanceA.coordinator.stop(), instanceB.coordinator.stop()]);
      }
      await Promise.allSettled([instanceA.adapter.stop(), instanceB.adapter.stop()]);
      disconnectRedis(instanceA.publisher);
      disconnectRedis(instanceA.subscriber);
      disconnectRedis(instanceB.publisher);
      disconnectRedis(instanceB.subscriber);
    }
  }, 15_000);
});

function createLogicalInstance(name: string, config: RedisConfig, store: InMemoryContestEventStore): LogicalInstance {
  const publisher = createRedisClient(config, `${name}:publisher`, false);
  const subscriber = createRedisClient(config, `${name}:subscriber`, true);
  const subscriberListenerBaseline = Object.fromEntries(
    adapterListenerEvents.map((event) => [event, subscriber.listenerCount(event)]),
  ) as LogicalInstance['subscriberListenerBaseline'];
  const adapter = new ContestEventNotificationRedisAdapter(publisher, subscriber, config);
  const coordinator = new ContestEventNotificationCoordinator(
    new ContestEventStreamService(store),
    new ContestSseHub(),
    adapter,
  );
  return { adapter, coordinator, publisher, subscriber, subscriberListenerBaseline };
}

function createRedisClient(config: RedisConfig, connectionSuffix: string, subscriber: boolean): Redis {
  const options: RedisOptions = {
    host: config.host,
    port: config.port,
    db: config.db,
    password: config.password || undefined,
    lazyConnect: true,
    connectTimeout: 1_000,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectionName: `${config.namespace}:${connectionSuffix}`,
    ...(subscriber
      ? {
          autoResubscribe: false,
          autoResendUnfulfilledCommands: false,
        }
      : { commandTimeout: 1_000 }),
  };
  const client = new Redis(options);
  client.on('error', ignoreRedisError);
  return client;
}

function redisConfig(namespace: string): RedisConfig {
  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    db: Number(process.env.REDIS_DB) || 0,
    password: process.env.REDIS_PASS || '',
    namespace,
  };
}

function watermark(latestEventId: number, streamRevision: number): ContestCommittedWatermark {
  return { contestId, canonicalUk, latestEventId, streamRevision };
}

async function setAuthoritativeWatermark(
  store: InMemoryContestEventStore,
  next: ContestCommittedWatermark,
): Promise<void> {
  await store.runInStreamTransaction(canonicalUk, async (transaction) => {
    transaction.stream.lastEventId = next.latestEventId;
    transaction.stream.streamRevision = next.streamRevision;
  });
}

function eventFrames(response: RecordingResponse): string[] {
  return response.writes.filter((chunk) => chunk.startsWith('event: events-available\n'));
}

function frame(latestEventId: number, streamRevision: number): string {
  return `event: events-available\ndata: ${JSON.stringify({ uk: requestUk, latestEventId, streamRevision })}\n\n`;
}

async function redisSubscriberCount(client: Redis, channel: string): Promise<number> {
  const result = await client.pubsub('NUMSUB', channel);
  return Number(result[1]);
}

async function waitFor(predicate: () => boolean, timeoutMs: number, description: string): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) {
      throw new Error(`Timed out waiting for ${description}`);
    }
    await delay(10);
  }
}

async function waitForAsync(predicate: () => Promise<boolean>, timeoutMs: number, description: string): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!(await predicate())) {
    if (Date.now() >= deadline) {
      throw new Error(`Timed out waiting for ${description}`);
    }
    await delay(10);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function expectAdapterListenersRestored(instance: LogicalInstance): void {
  for (const event of adapterListenerEvents) {
    expect(instance.subscriber.listenerCount(event)).toBe(instance.subscriberListenerBaseline[event]);
  }
}

function disconnectRedis(client: Redis): void {
  client.disconnect(false);
  client.removeListener('error', ignoreRedisError);
}

function ignoreRedisError(): void {
  // The test asserts behavior explicitly; this listener only prevents teardown errors from becoming unhandled events.
}
