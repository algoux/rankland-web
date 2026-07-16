import { EventEmitter } from 'events';
import RedisConfig from '@server/configs/redis/redis.config';
import { RedisClientId, RedisSubscriberClientId } from '@server/container-ids';
import ContestEventNotificationRedisAdapter, {
  CONTEST_EVENT_NOTIFICATION_PUBLISH_TIMEOUT_MS,
  buildContestEventNotificationChannel,
  parseContestEventNotificationEnvelope,
  serializeContestEventNotificationEnvelope,
} from '../contest-event-notification.redis';
import type {
  ContestEventNotificationRedisCallbacks,
  RedisPublisherPort,
  RedisSubscriberPort,
} from '../contest-event-notification.redis';
import type { ContestCommittedWatermark } from '../contest-event-watermark';

const watermark: ContestCommittedWatermark = {
  contestId: '70346717215600640',
  canonicalUk: 'contest-a',
  latestEventId: 123,
  streamRevision: 2,
};

describe('contest event notification Redis protocol', () => {
  it('builds one versioned channel from the deployment namespace', () => {
    expect(buildContestEventNotificationChannel('rankland:staging')).toBe(
      'rankland:staging:contest-event-availability:v1',
    );
    expect(() => buildContestEventNotificationChannel('   ')).toThrow(/namespace/i);
  });

  it('round-trips the strict v1 envelope without exposing internal field names on the wire', () => {
    const raw = serializeContestEventNotificationEnvelope(watermark);

    expect(raw).toBe(
      '{"schemaVersion":1,"contestId":"70346717215600640","uk":"contest-a","latestEventId":123,"streamRevision":2}',
    );
    expect(parseContestEventNotificationEnvelope(raw)).toEqual({ ok: true, watermark });
  });

  it('counts canonical UK length by Unicode code points like the public DTO', () => {
    const unicodeWatermark = { ...watermark, canonicalUk: '😀'.repeat(64) };
    const variationSelectorWatermark = { ...watermark, canonicalUk: '❤️'.repeat(64) };

    expect(parseContestEventNotificationEnvelope(serializeContestEventNotificationEnvelope(unicodeWatermark))).toEqual({
      ok: true,
      watermark: unicodeWatermark,
    });
    expect(
      parseContestEventNotificationEnvelope(serializeContestEventNotificationEnvelope(variationSelectorWatermark)),
    ).toEqual({
      ok: true,
      watermark: variationSelectorWatermark,
    });
    expect(() => serializeContestEventNotificationEnvelope({ ...watermark, canonicalUk: '😀'.repeat(65) })).toThrow(
      /canonicalUk/,
    );
    expect(() =>
      serializeContestEventNotificationEnvelope({
        ...watermark,
        canonicalUk: '❤️'.repeat(65),
      }),
    ).toThrow(/canonicalUk/);
  });

  it('applies the 4 KiB limit to UTF-8 bytes before schema validation', () => {
    const validRaw = serializeContestEventNotificationEnvelope(watermark);
    expect(Buffer.byteLength(validRaw, 'utf8')).toBeLessThan(4 * 1024);
    expect(parseContestEventNotificationEnvelope(validRaw.padEnd(4 * 1024, ' '))).toEqual({
      ok: true,
      watermark,
    });

    const oversizedButParseable = JSON.stringify({
      schemaVersion: 1,
      contestId: watermark.contestId,
      uk: watermark.canonicalUk,
      latestEventId: watermark.latestEventId,
      streamRevision: watermark.streamRevision,
      padding: '界'.repeat(1_400),
    });
    expect(oversizedButParseable.length).toBeLessThan(4 * 1024);
    expect(Buffer.byteLength(oversizedButParseable, 'utf8')).toBeGreaterThan(4 * 1024);
    expect(parseContestEventNotificationEnvelope(oversizedButParseable)).toEqual({
      ok: false,
      reason: 'too-large',
    });
  });

  it.each([
    ['invalid JSON', '{'],
    ['array', '[]'],
    ['unknown schema', JSON.stringify({ ...wireEnvelope(), schemaVersion: 2 })],
    ['extra field', JSON.stringify({ ...wireEnvelope(), extra: true })],
    ['numeric contest id', JSON.stringify({ ...wireEnvelope(), contestId: 1 })],
    ['zero contest id', JSON.stringify({ ...wireEnvelope(), contestId: '0' })],
    ['leading-zero contest id', JSON.stringify({ ...wireEnvelope(), contestId: '01' })],
    ['contest id above BIGINT UNSIGNED', JSON.stringify({ ...wireEnvelope(), contestId: '18446744073709551616' })],
    ['blank UK', JSON.stringify({ ...wireEnvelope(), uk: '   ' })],
    ['short UK', JSON.stringify({ ...wireEnvelope(), uk: 'ab' })],
    ['overlong UK', JSON.stringify({ ...wireEnvelope(), uk: 'u'.repeat(65) })],
    ['negative event id', JSON.stringify({ ...wireEnvelope(), latestEventId: -1 })],
    ['unsafe event id', JSON.stringify({ ...wireEnvelope(), latestEventId: Number.MAX_SAFE_INTEGER + 1 })],
    ['zero revision', JSON.stringify({ ...wireEnvelope(), streamRevision: 0 })],
    ['fractional revision', JSON.stringify({ ...wireEnvelope(), streamRevision: 1.5 })],
  ])('rejects %s', (_name, raw) => {
    expect(parseContestEventNotificationEnvelope(raw)).toEqual({
      ok: false,
      reason: raw === '{' ? 'invalid-json' : 'invalid-envelope',
    });
  });

  it('rejects invalid values before serialization', () => {
    expect(() =>
      serializeContestEventNotificationEnvelope({
        ...watermark,
        contestId: '18446744073709551616',
      }),
    ).toThrow(/contestId/);
    expect(() =>
      serializeContestEventNotificationEnvelope({
        ...watermark,
        streamRevision: Number.MAX_SAFE_INTEGER + 1,
      }),
    ).toThrow(/streamRevision/);
  });
});

describe('ContestEventNotificationRedisAdapter publisher', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('uses distinct command and subscriber dependency identifiers', () => {
    expect(RedisSubscriberClientId).not.toBe(RedisClientId);
  });

  it('publishes the v1 envelope on the namespaced channel while ready', async () => {
    const publisher = new FakePublisher();
    publisher.status = 'ready';
    publisher.publishResult = Promise.resolve(2);
    const adapter = createAdapter(publisher);

    await expect(adapter.publish(watermark)).resolves.toEqual({
      status: 'published',
      receiverCount: 2,
    });
    expect(publisher.published).toEqual([
      {
        channel: 'rankland:test:contest-event-availability:v1',
        message: serializeContestEventNotificationEnvelope(watermark),
      },
    ]);
  });

  it('skips publishing while the command client is not ready', async () => {
    const publisher = new FakePublisher();
    publisher.status = 'reconnecting';
    const adapter = createAdapter(publisher);

    await expect(adapter.publish(watermark)).resolves.toEqual({
      status: 'skipped',
      reason: 'not-ready',
    });
    expect(publisher.published).toEqual([]);
  });

  it('returns fail-open results for publish rejection and serialization errors', async () => {
    const publisher = new FakePublisher();
    publisher.status = 'ready';
    publisher.publishResult = Promise.reject(new TypeError('Redis write failed'));
    const adapter = createAdapter(publisher);

    await expect(adapter.publish(watermark)).resolves.toEqual({
      status: 'failed',
      reason: 'error',
      errorClass: 'TypeError',
    });
    await expect(adapter.publish({ ...watermark, streamRevision: 0 })).resolves.toEqual({
      status: 'failed',
      reason: 'error',
      errorClass: 'RangeError',
    });
  });

  it('bounds a publish that never settles', async () => {
    vi.useFakeTimers();
    const publisher = new FakePublisher();
    publisher.status = 'ready';
    publisher.publishResult = deferred<number>().promise;
    const adapter = createAdapter(publisher);

    const publishing = adapter.publish(watermark);
    await vi.advanceTimersByTimeAsync(CONTEST_EVENT_NOTIFICATION_PUBLISH_TIMEOUT_MS);

    await expect(publishing).resolves.toEqual({
      status: 'failed',
      reason: 'timeout',
    });
  });
});

describe('ContestEventNotificationRedisAdapter subscriber', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('connects in the background and only delivers after the explicit subscribe ACK', async () => {
    const subscriber = new FakeSubscriber();
    const subscribeAck = deferred<number>();
    subscriber.subscribeFactories.push(() => subscribeAck.promise);
    const adapter = createAdapter(new FakePublisher(), subscriber);
    const callbacks = createCallbacks();

    await expect(adapter.start(callbacks)).resolves.toBeUndefined();
    expect(adapter.getState()).toBe('connecting');
    expect(subscriber.connectCalls).toBe(1);

    subscriber.status = 'ready';
    subscriber.emit('ready');
    expect(adapter.getState()).toBe('subscribing');
    expect(subscriber.subscribedChannels).toEqual(['rankland:test:contest-event-availability:v1']);

    subscriber.emit(
      'message',
      'rankland:test:contest-event-availability:v1',
      serializeContestEventNotificationEnvelope(watermark),
    );
    expect(callbacks.onWatermark).not.toHaveBeenCalled();
    expect(callbacks.onSubscribed).not.toHaveBeenCalled();

    subscribeAck.resolve(1);
    await flushPromises();
    expect(adapter.getState()).toBe('subscribed');
    expect(callbacks.onSubscribed).toHaveBeenCalledTimes(1);

    subscriber.emit(
      'message',
      'rankland:test:contest-event-availability:v1',
      serializeContestEventNotificationEnvelope(watermark),
    );
    await flushPromises();
    expect(callbacks.onWatermark).toHaveBeenCalledWith(watermark);
  });

  it('ignores stale generation ACK and close callbacks', async () => {
    const subscriber = new FakeSubscriber();
    const firstAck = deferred<number>();
    const secondAck = deferred<number>();
    subscriber.subscribeFactories.push(
      () => firstAck.promise,
      () => secondAck.promise,
    );
    const adapter = createAdapter(new FakePublisher(), subscriber);
    const callbacks = createCallbacks();
    await adapter.start(callbacks);

    subscriber.status = 'ready';
    subscriber.emit('ready');
    subscriber.status = 'reconnecting';
    subscriber.emit('close');
    expect(adapter.getState()).toBe('degraded');

    subscriber.status = 'ready';
    subscriber.emit('ready');
    firstAck.resolve(1);
    await flushPromises();
    expect(adapter.getState()).toBe('subscribing');
    expect(callbacks.onSubscribed).not.toHaveBeenCalled();

    secondAck.resolve(1);
    await flushPromises();
    expect(adapter.getState()).toBe('subscribed');
    expect(callbacks.onSubscribed).toHaveBeenCalledTimes(1);

    // ioredis changes status before emitting a real close. A close callback
    // observed after a newer ready epoch must not degrade that current epoch.
    subscriber.status = 'ready';
    subscriber.emit('close');
    expect(adapter.getState()).toBe('subscribed');
  });

  it('recovers from initial connect and subscribe failures on a later ready epoch', async () => {
    const subscriber = new FakeSubscriber();
    subscriber.connectFactory = () => Promise.reject(new Error('initial Redis unavailable'));
    subscriber.subscribeFactories.push(
      () => Promise.reject(new Error('subscribe failed')),
      () => Promise.resolve(1),
    );
    const adapter = createAdapter(new FakePublisher(), subscriber);
    const callbacks = createCallbacks();

    await adapter.start(callbacks);
    await flushPromises();
    expect(adapter.getState()).toBe('degraded');

    subscriber.status = 'ready';
    subscriber.emit('ready');
    await flushPromises();
    expect(adapter.getState()).toBe('degraded');

    subscriber.status = 'ready';
    subscriber.emit('ready');
    await flushPromises();
    expect(adapter.getState()).toBe('subscribed');
    expect(callbacks.onSubscribed).toHaveBeenCalledTimes(1);
  });

  it('drops invalid and foreign-channel messages without invoking callbacks', async () => {
    const subscriber = new FakeSubscriber();
    const adapter = createAdapter(new FakePublisher(), subscriber);
    const callbacks = createCallbacks();
    await adapter.start(callbacks);
    subscriber.status = 'ready';
    subscriber.emit('ready');
    await flushPromises();

    subscriber.emit('message', 'another:channel', serializeContestEventNotificationEnvelope(watermark));
    subscriber.emit('message', 'rankland:test:contest-event-availability:v1', '{');
    await flushPromises();

    expect(callbacks.onWatermark).not.toHaveBeenCalled();
    expect(adapter.getState()).toBe('subscribed');
  });

  it('stops without network waits and leaves late callbacks terminal', async () => {
    const subscriber = new FakeSubscriber();
    const lateAck = deferred<number>();
    subscriber.subscribeFactories.push(() => lateAck.promise);
    const adapter = createAdapter(new FakePublisher(), subscriber);
    const callbacks = createCallbacks();
    await adapter.start(callbacks);
    subscriber.status = 'ready';
    subscriber.emit('ready');

    const stopping = adapter.stop();
    expect(adapter.getState()).toBe('stopped');
    expect(subscriber.disconnectArgs).toEqual([false]);
    expect(subscriber.eventNames()).toEqual([]);
    await stopping;

    lateAck.resolve(1);
    subscriber.emit('ready');
    subscriber.emit(
      'message',
      'rankland:test:contest-event-availability:v1',
      serializeContestEventNotificationEnvelope(watermark),
    );
    await flushPromises();
    expect(callbacks.onSubscribed).not.toHaveBeenCalled();
    expect(callbacks.onWatermark).not.toHaveBeenCalled();
    await adapter.start(callbacks);
    expect(subscriber.connectCalls).toBe(1);
  });
});

describe('ContestEventNotificationRedisAdapter logging', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('rate-limits subscriber failures for 30 seconds and reports suppressed errors on recovery', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-16T00:00:00.000Z'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const subscriber = new FakeSubscriber();
    const adapter = createAdapter(new FakePublisher(), subscriber);
    await adapter.start(createCallbacks());

    subscriber.status = 'reconnecting';
    subscriber.emit('error', new TypeError('endpoint and password must stay private'));
    await vi.advanceTimersByTimeAsync(29_999);
    subscriber.emit('close');
    await vi.advanceTimersByTimeAsync(1);
    subscriber.emit('error', new RangeError('second failure'));
    await vi.advanceTimersByTimeAsync(1);
    subscriber.emit('close');

    const failures = warn.mock.calls.filter(([event]) => event === 'contest_event_notification.redis_failed');
    expect(failures).toHaveLength(2);
    expect(failures[0][1]).toMatchObject({
      operation: 'error',
      errorClass: 'TypeError',
      suppressedCount: 0,
    });
    expect(failures[1][1]).toMatchObject({
      operation: 'error',
      errorClass: 'RangeError',
      suppressedCount: 1,
    });
    expect(JSON.stringify(failures)).not.toContain('endpoint and password');

    subscriber.status = 'ready';
    subscriber.emit('ready');
    await flushPromises();

    const recoveries = info.mock.calls.filter(([event]) => event === 'contest_event_notification.redis_recovered');
    expect(recoveries).toHaveLength(1);
    expect(recoveries[0][1]).toMatchObject({
      state: 'subscribed',
      suppressedCount: 1,
    });
  });

  it('rate-limits publisher failures and starts a fresh episode after recovery', async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const publisher = new FakePublisher();
    publisher.status = 'reconnecting';
    const adapter = createAdapter(publisher);

    await adapter.publish(watermark);
    await adapter.publish(watermark);
    expect(warn.mock.calls.filter(([event]) => event === 'contest_event_notification.publish_failed')).toHaveLength(1);

    publisher.status = 'ready';
    publisher.publishResult = Promise.resolve(1);
    await adapter.publish(watermark);
    expect(info.mock.calls.filter(([event]) => event === 'contest_event_notification.publish_recovered')).toEqual([
      [
        'contest_event_notification.publish_recovered',
        expect.objectContaining({
          receiverCount: 1,
          suppressedCount: 1,
        }),
      ],
    ]);

    publisher.status = 'reconnecting';
    await adapter.publish(watermark);
    expect(warn.mock.calls.filter(([event]) => event === 'contest_event_notification.publish_failed')).toHaveLength(2);
  });

  it('rate-limits invalid-message logs without including the raw payload', async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const subscriber = new FakeSubscriber();
    const adapter = createAdapter(new FakePublisher(), subscriber);
    await adapter.start(createCallbacks());
    subscriber.status = 'ready';
    subscriber.emit('ready');
    await flushPromises();

    const secretPayload = '{not-json-password=secret}';
    subscriber.emit('message', 'rankland:test:contest-event-availability:v1', secretPayload);
    subscriber.emit('message', 'rankland:test:contest-event-availability:v1', secretPayload);

    const invalidMessages = warn.mock.calls.filter(([event]) => event === 'contest_event_notification.invalid_message');
    expect(invalidMessages).toHaveLength(1);
    expect(invalidMessages[0][1]).toMatchObject({
      reason: 'invalid-json',
      suppressedCount: 0,
    });
    expect(JSON.stringify(invalidMessages)).not.toContain(secretPayload);
  });
});

function wireEnvelope() {
  return {
    schemaVersion: 1,
    contestId: watermark.contestId,
    uk: watermark.canonicalUk,
    latestEventId: watermark.latestEventId,
    streamRevision: watermark.streamRevision,
  };
}

class FakePublisher implements RedisPublisherPort {
  public status = 'wait';
  public publishResult: Promise<number> = Promise.resolve(0);
  public readonly published: Array<{ channel: string; message: string }> = [];

  public publish(channel: string, message: string): Promise<number> {
    this.published.push({ channel, message });
    return this.publishResult;
  }
}

class FakeSubscriber extends EventEmitter implements RedisSubscriberPort {
  public status = 'wait';
  public connectCalls = 0;
  public connectFactory: () => Promise<unknown> = () => Promise.resolve();
  public readonly subscribeFactories: Array<() => Promise<number>> = [];
  public readonly subscribedChannels: string[] = [];
  public readonly disconnectArgs: boolean[] = [];

  public connect(): Promise<unknown> {
    this.connectCalls += 1;
    return this.connectFactory();
  }

  public subscribe(channel: string): Promise<number> {
    this.subscribedChannels.push(channel);
    return this.subscribeFactories.shift()?.() || Promise.resolve(1);
  }

  public disconnect(reconnect: boolean): void {
    this.disconnectArgs.push(reconnect);
  }
}

function createAdapter(publisher = new FakePublisher(), subscriber = new FakeSubscriber()) {
  const config: RedisConfig = {
    host: '127.0.0.1',
    port: 6379,
    db: 0,
    password: '',
    namespace: 'rankland:test',
  };
  return new ContestEventNotificationRedisAdapter(publisher, subscriber, config);
}

function createCallbacks(): ContestEventNotificationRedisCallbacks & {
  onWatermark: ReturnType<typeof vi.fn>;
  onSubscribed: ReturnType<typeof vi.fn>;
} {
  return {
    onWatermark: vi.fn(),
    onSubscribed: vi.fn(),
  };
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

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}
