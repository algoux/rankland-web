import { EventEmitter } from 'events';
import ContestSseHub from '../contest-sse-hub';

class FakeResponse extends EventEmitter {
  public readonly writes: string[] = [];
  public readonly writeResults: boolean[] = [];
  public writeError?: Error;
  public writeHook?: () => void;
  public endCalls = 0;
  public destroyCalls = 0;
  public destroyed = false;
  public writableEnded = false;
  public writableFinished = false;

  public write(chunk: string): boolean {
    if (this.writeError) throw this.writeError;
    this.writeHook?.();
    this.writes.push(chunk);
    return this.writeResults.shift() ?? true;
  }

  public end(): void {
    this.endCalls += 1;
    this.writableEnded = true;
  }

  public destroy(): void {
    this.destroyCalls += 1;
    this.destroyed = true;
  }
}

function watermark(latestEventId: number, streamRevision = 1) {
  return {
    contestId: '70346717215600640',
    canonicalUk: 'contest-a',
    latestEventId,
    streamRevision,
  };
}

function eventFrame(uk: string, latestEventId: number, streamRevision = 1) {
  return `event: events-available\ndata: ${JSON.stringify({ uk, latestEventId, streamRevision })}\n\n`;
}

const synchronousNotificationEnvironment = {
  CONTEST_EVENT_NOTIFICATION_COALESCE_WINDOW_MS: '0',
  CONTEST_EVENT_NOTIFICATION_FANOUT_SHARDS: '1',
  CONTEST_EVENT_NOTIFICATION_FANOUT_WINDOW_MS: '0',
} as const;
type SynchronousNotificationEnvironmentKey = keyof typeof synchronousNotificationEnvironment;

describe('ContestSseHub', () => {
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
    vi.useRealTimers();
  });

  it('writes each event as one frame and gives every new client its own initial watermark', () => {
    const hub = new ContestSseHub();
    const first = new FakeResponse();
    const second = new FakeResponse();

    const firstRegistration = hub.addClient('70346717215600640', 'Contest-A', first);
    const secondRegistration = hub.addClient('70346717215600640', 'Contest-A', second);
    firstRegistration.notifyInitial(watermark(7, 2));
    secondRegistration.notifyInitial(watermark(7, 2));

    expect(first.writes).toEqual([eventFrame('Contest-A', 7, 2)]);
    expect(second.writes).toEqual([eventFrame('Contest-A', 7, 2)]);
  });

  it('buffers live watermarks for a prepared client until activation', () => {
    const hub = new ContestSseHub();
    const response = new FakeResponse();
    const prepared = hub.prepareClient('70346717215600640', 'Contest-A', response);

    hub.notify(watermark(8));
    hub.notify(watermark(10));
    expect(response.writes).toEqual([]);

    prepared.activate(watermark(7));
    expect(response.writes).toEqual([eventFrame('Contest-A', 10)]);
  });

  it('aborts a prepared client without committing or ending its HTTP response', () => {
    const hub = new ContestSseHub();
    const response = new FakeResponse();
    const prepared = hub.prepareClient('70346717215600640', 'Contest-A', response);

    prepared.abort();

    expect(response.writes).toEqual([]);
    expect(response.endCalls).toBe(0);
    expect(hub.getActiveContestIds()).toEqual([]);
  });

  it('aborts unactivated clients without committing a 200 when the hub drains', () => {
    const hub = new ContestSseHub();
    const response = new FakeResponse();
    const prepared = hub.prepareClient('70346717215600640', 'Contest-A', response);

    hub.beginDraining();
    hub.closeAll();

    expect(prepared.closed).toBe(true);
    expect(response.writes).toEqual([]);
    expect(response.endCalls).toBe(0);
    expect(hub.getActiveContestIds()).toEqual([]);
  });

  it('only advances each client watermark in revision-first order', () => {
    const hub = new ContestSseHub();
    const response = new FakeResponse();
    hub.addClient('70346717215600640', 'Contest-A', response).notifyInitial(watermark(100, 1));

    hub.notify(watermark(100, 1));
    hub.notify(watermark(99, 1));
    hub.notify(watermark(0, 2));
    hub.notify(watermark(999, 1));

    expect(response.writes).toEqual([eventFrame('Contest-A', 100, 1), eventFrame('Contest-A', 0, 2)]);
  });

  it('coalesces to the latest watermark and fans out in deterministic shards', () => {
    vi.useFakeTimers();
    const hub = new ContestSseHub({
      coalesceWindowMs: 25,
      fanoutShards: 2,
      fanoutWindowMs: 100,
      summaryIntervalMs: 60_000,
    });
    const responses = Array.from({ length: 4 }, () => new FakeResponse());
    for (const response of responses) hub.addClient('70346717215600640', 'contest-a', response);

    hub.notify(watermark(8));
    hub.notify(watermark(10));
    expect(responses.map((response) => response.writes.length)).toEqual([0, 0, 0, 0]);

    vi.advanceTimersByTime(25);
    expect(responses.map((response) => response.writes)).toEqual([
      [eventFrame('contest-a', 10)],
      [],
      [eventFrame('contest-a', 10)],
      [],
    ]);
    vi.advanceTimersByTime(99);
    expect(responses.map((response) => response.writes.length)).toEqual([1, 0, 1, 0]);
    vi.advanceTimersByTime(1);
    expect(responses.map((response) => response.writes)).toEqual(
      Array.from({ length: 4 }, () => [eventFrame('contest-a', 10)]),
    );
  });

  it('sends initial authority immediately but never below an already queued live watermark', () => {
    vi.useFakeTimers();
    const hub = new ContestSseHub({
      coalesceWindowMs: 25,
      fanoutShards: 2,
      fanoutWindowMs: 100,
      summaryIntervalMs: 60_000,
    });
    const response = new FakeResponse();
    const registration = hub.addClient('70346717215600640', 'contest-a', response);

    hub.notify(watermark(10));
    registration.notifyInitial(watermark(8));

    expect(response.writes).toEqual([eventFrame('contest-a', 10)]);
    vi.advanceTimersByTime(125);
    expect(response.writes).toEqual([eventFrame('contest-a', 10)]);
  });

  it('advances unflushed shards immediately and follows up only clients that received the older watermark', () => {
    vi.useFakeTimers();
    const hub = new ContestSseHub({
      coalesceWindowMs: 25,
      fanoutShards: 2,
      fanoutWindowMs: 100,
      summaryIntervalMs: 60_000,
    });
    const responses = Array.from({ length: 4 }, () => new FakeResponse());
    for (const response of responses) hub.addClient('70346717215600640', 'contest-a', response);

    hub.notify(watermark(8));
    vi.advanceTimersByTime(25);
    hub.notify(watermark(10));
    vi.advanceTimersByTime(100);
    expect(responses.map((response) => response.writes)).toEqual([
      [eventFrame('contest-a', 8)],
      [eventFrame('contest-a', 10)],
      [eventFrame('contest-a', 8)],
      [eventFrame('contest-a', 10)],
    ]);

    vi.advanceTimersByTime(25);
    vi.advanceTimersByTime(100);
    expect(responses.every((response) => response.writes.at(-1) === eventFrame('contest-a', 10))).toBe(true);
    expect(responses.map((response) => response.writes.length)).toEqual([2, 1, 2, 1]);
  });

  it('keeps shard scheduling monotonic when the wall clock jumps during delivery', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-20T00:00:00.000Z'));
    const hub = new ContestSseHub({
      coalesceWindowMs: 25,
      fanoutShards: 2,
      fanoutWindowMs: 100,
      summaryIntervalMs: 60_000,
    });
    const first = new FakeResponse();
    const second = new FakeResponse();
    first.writeHook = () => vi.setSystemTime(new Date('2026-07-19T00:00:00.000Z'));
    hub.addClient('70346717215600640', 'contest-a', first);
    hub.addClient('70346717215600640', 'contest-a', second);

    hub.notify(watermark(10));
    vi.advanceTimersByTime(25);
    expect(first.writes).toEqual([eventFrame('contest-a', 10)]);
    vi.advanceTimersByTime(100);
    expect(second.writes).toEqual([eventFrame('contest-a', 10)]);
  });

  it('rotates the first shard and ignores a duplicate after the previous cycle completes', () => {
    vi.useFakeTimers();
    const hub = new ContestSseHub({
      coalesceWindowMs: 25,
      fanoutShards: 2,
      fanoutWindowMs: 100,
      summaryIntervalMs: 60_000,
    });
    const responses = Array.from({ length: 4 }, () => new FakeResponse());
    for (const response of responses) hub.addClient('70346717215600640', 'contest-a', response);

    hub.notify(watermark(10));
    vi.advanceTimersByTime(125);
    hub.notify(watermark(10));
    expect(vi.getTimerCount()).toBe(0);

    hub.notify(watermark(11));
    vi.advanceTimersByTime(25);
    expect(responses.map((response) => response.writes.length)).toEqual([1, 2, 1, 2]);
    vi.advanceTimersByTime(100);
    expect(responses.every((response) => response.writes.length === 2)).toBe(true);
  });

  it('emits interval-scoped notification maxima and resets them after each summary', () => {
    vi.useFakeTimers();
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const hub = new ContestSseHub({
      coalesceWindowMs: 25,
      fanoutShards: 2,
      fanoutWindowMs: 100,
      summaryIntervalMs: 1_000,
    });
    hub.start();
    hub.addClient('70346717215600640', 'contest-a', new FakeResponse());
    hub.addClient('70346717215600640', 'contest-a', new FakeResponse());

    hub.notify(watermark(10));
    vi.advanceTimersByTime(1_000);
    vi.advanceTimersByTime(1_000);

    const summaries = info.mock.calls
      .filter(([event]) => event === 'contest_event_notification_runtime.summary')
      .map(([, payload]) => JSON.parse(String(payload)));
    expect(summaries[0]).toMatchObject({
      maximaScope: 'interval',
      maxima: {
        'fanout.notifyToLastShardMsMax': expect.any(Number),
      },
    });
    expect(summaries[1]).toMatchObject({ maximaScope: 'interval', maxima: {} });

    hub.beginDraining();
    hub.closeAll();
    info.mockRestore();
  });

  it('continues later shards when one client write throws', () => {
    vi.useFakeTimers();
    const hub = new ContestSseHub({
      coalesceWindowMs: 25,
      fanoutShards: 2,
      fanoutWindowMs: 100,
      summaryIntervalMs: 60_000,
    });
    const broken = new FakeResponse();
    broken.writeError = new Error('socket failed');
    const healthy = new FakeResponse();
    hub.addClient('70346717215600640', 'contest-a', broken);
    hub.addClient('70346717215600640', 'contest-a', healthy);

    hub.notify(watermark(10));
    vi.advanceTimersByTime(125);

    expect(broken.destroyCalls).toBe(1);
    expect(healthy.writes).toEqual([eventFrame('contest-a', 10)]);
  });

  it('cancels queued fanout when a contest closes or the Hub begins draining', () => {
    vi.useFakeTimers();
    const hub = new ContestSseHub({
      coalesceWindowMs: 25,
      fanoutShards: 2,
      fanoutWindowMs: 100,
      summaryIntervalMs: 60_000,
    });
    const first = new FakeResponse();
    hub.addClient('70346717215600640', 'contest-a', first);
    hub.notify(watermark(8));
    hub.closeContest('70346717215600640');
    vi.runAllTimers();
    expect(first.writes).toEqual([]);

    const second = new FakeResponse();
    hub.addClient('2', 'contest-b', second);
    hub.notify({ contestId: '2', canonicalUk: 'contest-b', latestEventId: 9, streamRevision: 1 });
    hub.beginDraining();
    vi.runAllTimers();
    expect(second.writes).toEqual([]);
  });

  it('keeps one latest pending watermark while a client is blocked', () => {
    const hub = new ContestSseHub();
    const response = new FakeResponse();
    response.writeResults.push(false, true);
    hub.addClient('70346717215600640', 'contest-a', response).notifyInitial(watermark(7));

    hub.notify(watermark(8));
    const latest = watermark(10);
    hub.notify(latest);
    latest.latestEventId = 0;
    hub.notify(watermark(9));
    expect(response.writes).toEqual([eventFrame('contest-a', 7)]);

    response.emit('drain');
    expect(response.writes).toEqual([eventFrame('contest-a', 7), eventFrame('contest-a', 10)]);
    expect(response.endCalls).toBe(0);
  });

  it('can become blocked again when the drain flush also fills the buffer', () => {
    const hub = new ContestSseHub();
    const response = new FakeResponse();
    response.writeResults.push(false, false, true);
    hub.addClient('70346717215600640', 'contest-a', response).notifyInitial(watermark(7));
    hub.notify(watermark(8));

    response.emit('drain');
    hub.notify(watermark(9));
    response.emit('drain');

    expect(response.writes).toEqual([
      eventFrame('contest-a', 7),
      eventFrame('contest-a', 8),
      eventFrame('contest-a', 9),
    ]);
  });

  it('sends heartbeats to writable clients and closes blocked clients after ten seconds', () => {
    vi.useFakeTimers();
    const hub = new ContestSseHub();
    const healthy = new FakeResponse();
    const blocked = new FakeResponse();
    hub.addClient('1', 'healthy', healthy);
    const blockedRegistration = hub.addClient('2', 'blocked', blocked);
    hub.start();

    vi.advanceTimersByTime(10_000);
    blocked.writeResults.push(false);
    blockedRegistration.notifyInitial({
      contestId: '2',
      canonicalUk: 'blocked',
      latestEventId: 0,
      streamRevision: 1,
    });

    vi.advanceTimersByTime(5_000);
    expect(healthy.writes).toEqual([': heartbeat\n\n']);
    expect(blocked.writes).toHaveLength(1);
    vi.advanceTimersByTime(4_999);
    expect(blocked.endCalls).toBe(0);
    expect(blocked.destroyCalls).toBe(0);
    expect(blocked.writes).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(blocked.endCalls).toBe(0);
    expect(blocked.destroyCalls).toBe(1);
  });

  it('tracks active contests and closes all clients idempotently', () => {
    const hub = new ContestSseHub();
    const first = new FakeResponse();
    const second = new FakeResponse();
    hub.addClient('1', 'contest-a', first);
    hub.addClient('2', 'contest-b', second);

    expect(hub.hasActiveClients('1')).toBe(true);
    expect(hub.hasActiveClients('missing')).toBe(false);
    expect(hub.getActiveContestIds()).toEqual(['1', '2']);
    hub.closeContest('1');
    expect(first.endCalls).toBe(1);
    expect(hub.hasActiveClients('1')).toBe(false);
    expect(hub.getActiveContestIds()).toEqual(['2']);

    hub.closeAll();
    hub.closeAll();
    expect(second.endCalls).toBe(1);
    expect(hub.getActiveContestIds()).toEqual([]);
  });

  it('makes a closed registration terminal and rejects new clients while draining', () => {
    const hub = new ContestSseHub();
    const response = new FakeResponse();
    response.writeResults.push(false);
    const registration = hub.addClient('1', 'contest-a', response);
    registration.notifyInitial({ contestId: '1', canonicalUk: 'contest-a', latestEventId: 1, streamRevision: 1 });

    registration.close();
    registration.close();
    registration.notifyInitial({ contestId: '1', canonicalUk: 'contest-a', latestEventId: 2, streamRevision: 1 });
    response.emit('drain');
    expect(response.writes).toEqual([eventFrame('contest-a', 1)]);
    expect(response.endCalls).toBe(0);
    expect(response.destroyCalls).toBe(1);
    expect(response.listenerCount('drain')).toBe(0);

    hub.beginDraining();
    const late = new FakeResponse();
    const lateRegistration = hub.addClient('2', 'contest-b', late);
    lateRegistration.notifyInitial({ contestId: '2', canonicalUk: 'contest-b', latestEventId: 1, streamRevision: 1 });
    expect(late.endCalls).toBe(1);
    expect(late.writes).toEqual([]);
    expect(hub.getActiveContestIds()).toEqual([]);
  });

  it.each(['close', 'error', 'finish'])('removes timers and listeners after the response %s event', (event) => {
    vi.useFakeTimers();
    const hub = new ContestSseHub();
    const response = new FakeResponse();
    response.writeResults.push(false);
    hub.addClient('1', 'contest-a', response).notifyInitial(watermark(1));

    response.emit(event);
    expect(hub.getActiveContestIds()).toEqual([]);
    expect(response.listenerCount('close')).toBe(0);
    expect(response.listenerCount('error')).toBe(0);
    expect(response.listenerCount('finish')).toBe(0);
    expect(response.listenerCount('drain')).toBe(0);

    vi.advanceTimersByTime(10_000);
    expect(response.endCalls).toBe(0);
    expect(response.destroyCalls).toBe(0);
  });
});
