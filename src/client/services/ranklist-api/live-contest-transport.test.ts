import { describe, expect, it, vi } from 'vitest';
import {
  HttpLiveContestTransport,
  type HttpLiveContestTransportOptions,
  LiveContestTransportError,
} from './live-contest-transport';

const contest = {
  _id: '42',
  uk: 'summer-2026',
  name: 'Summer Contest',
  title: { fallback: 'Summer Contest' },
  startAt: '2026-07-24T00:00:00.000Z',
  duration: [5, 'h'],
  frozenDuration: null,
  banner: null,
  refLinks: null,
  problems: [{ alias: 'A' }],
  users: [{ id: 'alice', name: 'Alice' }],
  markers: null,
  series: null,
  sorter: { algorithm: 'ICPC', config: {} },
  contributors: ['algoUX'],
  srkFileID: null,
  viewCount: 0,
  redirectUK: null,
} as const;

function createTransport(overrides: Partial<HttpLiveContestTransportOptions> = {}) {
  const apiClient = {
    getPublicContest: vi.fn(async () => contest),
    getPublicContestEventStream: vi.fn(async () => ({
      uk: contest.uk,
      lastEventId: 12,
      streamRevision: 3,
    })),
  };
  const request = vi.fn(async () => ({
    status: 200,
    headers: {
      'content-type': 'application/protobuf',
      'x-rl-resp-success': 'true',
      'x-rl-resp-code': '0',
    },
    data: new Uint8Array([1, 2, 3]).buffer,
  }));
  const decodeEventPage = vi.fn(() => ({
    uk: contest.uk,
    fromEventId: 1,
    toEventId: 12,
    checkpointEventId: 12,
    latestEventId: 12,
    streamRevision: 3,
    hasMore: false,
    resetRequired: false,
    resetReason: '',
    events: [],
  }));
  const transportOptions: HttpLiveContestTransportOptions = {
    apiClient: apiClient as never,
    request,
    decodeEventPage,
    eventSourceFactory: vi.fn() as never,
    ...overrides,
  };
  return {
    apiClient,
    request,
    decodeEventPage,
    transport: new HttpLiveContestTransport(transportOptions),
  };
}

describe('HttpLiveContestTransport', () => {
  it('maps public contest metadata into the live projection config', async () => {
    const { transport } = createTransport();

    await expect(transport.getContest(contest.uk)).resolves.toEqual({
      uk: contest.uk,
      name: contest.name,
      contest: {
        title: contest.title,
        startAt: contest.startAt,
        duration: contest.duration,
      },
      problems: contest.problems,
      users: contest.users,
      markers: [],
      series: [],
      sorter: contest.sorter,
      contributors: contest.contributors,
    });
  });

  it('always requests a protobuf compact page and decodes its ArrayBuffer', async () => {
    const { transport, request, decodeEventPage } = createTransport();
    const controller = new AbortController();

    await expect(transport.getEvents({
      uk: contest.uk,
      afterEventId: 5,
      streamRevision: 3,
      signal: controller.signal,
    })).resolves.toMatchObject({
      checkpointEventId: 12,
      streamRevision: 3,
    });

    expect(request).toHaveBeenCalledWith(expect.objectContaining({
      method: 'GET',
      url: `/v2/public/contests/${contest.uk}/events`,
      params: {
        afterEventId: 5,
        limit: 1000,
        streamRevision: 3,
        compactProgress: true,
      },
      headers: {
        Accept: 'application/protobuf',
      },
      responseType: 'arraybuffer',
      signal: controller.signal,
    }));
    const requestConfig = request.mock.calls[0][0];
    expect(requestConfig.validateStatus?.(503)).toBe(true);
    expect(decodeEventPage).toHaveBeenCalledWith(new Uint8Array([1, 2, 3]));
  });

  it('forwards stream-state cancellation and normalizes request failures', async () => {
    const failure = Object.assign(new Error('offline'), {
      code: 'ERR_NETWORK',
      name: 'AxiosError',
    });
    const getPublicContestEventStream = vi.fn(async () => Promise.reject(failure));
    const apiClient: HttpLiveContestTransportOptions['apiClient'] = {
      getPublicContest: vi.fn(async () => contest),
      getPublicContestEventStream,
    };
    const { transport } = createTransport({
      apiClient,
    });
    const controller = new AbortController();

    await expect(transport.getStreamState(contest.uk, controller.signal)).rejects.toMatchObject({
      name: 'LiveContestTransportError',
      aborted: false,
      transient: true,
      code: 'ERR_NETWORK',
    });
    expect(getPublicContestEventStream).toHaveBeenCalledWith(
      { uk: contest.uk },
      { signal: controller.signal },
    );
  });

  it('honors Retry-After from stream-state HTTP failures', async () => {
    const failure = Object.assign(new Error('busy'), {
      code: 'ERR_BAD_RESPONSE',
      name: 'AxiosError',
      response: {
        status: 503,
        headers: {
          'retry-after': '60',
        },
      },
    });
    const apiClient: HttpLiveContestTransportOptions['apiClient'] = {
      getPublicContest: vi.fn(async () => contest),
      getPublicContestEventStream: vi.fn(async () => Promise.reject(failure)),
    };
    const { transport } = createTransport({ apiClient });

    await expect(
      transport.getStreamState(contest.uk, new AbortController().signal),
    ).rejects.toMatchObject({
      name: 'LiveContestTransportError',
      status: 503,
      retryAfterMs: 60_000,
      transient: true,
    });
  });

  it('normalizes an aborted event request without exposing Axios details', async () => {
    const controller = new AbortController();
    controller.abort();
    const { transport } = createTransport({
      request: vi.fn(async () => Promise.reject(Object.assign(new Error('cancelled'), {
        code: 'ERR_CANCELED',
        name: 'CanceledError',
      }))),
    });

    await expect(transport.getEvents({
      uk: contest.uk,
      afterEventId: 0,
      streamRevision: 3,
      signal: controller.signal,
    })).rejects.toMatchObject({
      name: 'LiveContestTransportError',
      aborted: true,
      transient: false,
    });
  });

  it('reads protobuf failures from response headers without decoding the empty body', async () => {
    const { transport, decodeEventPage } = createTransport({
      request: vi.fn(async () => ({
        status: 503,
        headers: {
          'content-type': 'application/protobuf',
          'x-rl-resp-success': 'false',
          'x-rl-resp-code': '100008',
          'x-rl-resp-msg': 'temporarily%20unavailable',
          'x-rl-resp-meta': '%7B%22scope%22%3A%22contest%22%7D',
          'retry-after': '1',
        },
        data: new ArrayBuffer(0),
      })),
    });

    await expect(transport.getEvents({
      uk: contest.uk,
      afterEventId: 5,
      streamRevision: 3,
      signal: new AbortController().signal,
    })).rejects.toMatchObject<Partial<LiveContestTransportError>>({
      name: 'LiveContestTransportError',
      status: 503,
      code: 100008,
      meta: { scope: 'contest' },
      retryAfterMs: 1000,
      transient: true,
    });
    expect(decodeEventPage).not.toHaveBeenCalled();
  });

  it('rejects a successful JSON response instead of silently falling back', async () => {
    const { transport } = createTransport({
      request: vi.fn(async () => ({
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-rl-resp-success': 'true',
        },
        data: new TextEncoder().encode('{}').buffer,
      })),
    });

    await expect(transport.getEvents({
      uk: contest.uk,
      afterEventId: 0,
      streamRevision: 3,
      signal: new AbortController().signal,
    })).rejects.toMatchObject({
      name: 'LiveContestTransportError',
      protocolError: true,
    });
  });

  it('validates named SSE watermarks and closes the underlying EventSource', () => {
    const listeners = new Map<string, (event: any) => void>();
    const close = vi.fn();
    const eventSourceFactory = vi.fn(() => ({
      addEventListener: (type: string, listener: (event: any) => void) => {
        listeners.set(type, listener);
      },
      close,
    }));
    const { transport } = createTransport({
      eventSourceFactory: eventSourceFactory as never,
    });
    const onAvailable = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const subscription = transport.subscribeEvents(contest.uk, {
      onAvailable,
      onError: vi.fn(),
    });
    listeners.get('events-available')?.({
      data: JSON.stringify({
        uk: contest.uk,
        latestEventId: 13,
        streamRevision: 3,
      }),
    });
    listeners.get('events-available')?.({
      data: JSON.stringify({
        uk: contest.uk,
        latestEventId: -1,
        streamRevision: 0,
      }),
    });
    subscription.close();

    expect(onAvailable).toHaveBeenCalledOnce();
    expect(onAvailable).toHaveBeenCalledWith({
      uk: contest.uk,
      latestEventId: 13,
      streamRevision: 3,
    });
    expect(close).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
