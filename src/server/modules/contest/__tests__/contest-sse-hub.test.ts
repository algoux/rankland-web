import { EventEmitter } from 'events';
import ContestSseHub from '../contest-sse-hub';

class FakeResponse extends EventEmitter {
  public readonly writes: string[] = [];
  public readonly writeResults: boolean[] = [];
  public endCalls = 0;
  public destroyCalls = 0;
  public destroyed = false;
  public writableEnded = false;
  public writableFinished = false;

  public write(chunk: string): boolean {
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

describe('ContestSseHub', () => {
  afterEach(() => {
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

    expect(hub.getActiveContestIds()).toEqual(['1', '2']);
    hub.closeContest('1');
    expect(first.endCalls).toBe(1);
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
