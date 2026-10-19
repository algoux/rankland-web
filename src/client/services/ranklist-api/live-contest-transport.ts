import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import type * as srk from '@algoux/standard-ranklist';
import type { ApiClientType } from '@/api';
import type {
  LiveContestConfig,
  LiveContestEventPage,
  LiveContestEventSubscription,
  LiveContestEventsAvailable,
  LiveContestFailure,
  LiveContestStreamState,
  LiveContestTransport,
} from './live-contest-types';

const PROTOBUF_CONTENT_TYPES = new Set(['application/protobuf', 'application/x-protobuf']);

type LiveContestApiClient = Pick<ApiClientType, 'getPublicContest' | 'getPublicContestEventStream'>;

export interface LiveContestHttpClient {
  request: (config: AxiosRequestConfig) => Promise<AxiosResponse<ArrayBuffer>>;
}

interface EventSourceLike {
  addEventListener: ((type: 'events-available', listener: (event: MessageEvent<string>) => void) => void) & ((type: 'error', listener: (event: Event) => void) => void);
  close: () => void;
}

export interface HttpLiveContestTransportOptions {
  apiClient: LiveContestApiClient;
  request: LiveContestHttpClient['request'];
  decodeEventPage: (bytes: Uint8Array) => LiveContestEventPage | Promise<LiveContestEventPage>;
  eventSourceFactory: (url: string) => EventSourceLike;
}

export class LiveContestTransportError extends Error implements LiveContestFailure {
  public readonly status?: number;
  public readonly code?: string | number;
  public readonly meta?: unknown;
  public readonly retryAfterMs?: number;
  public readonly aborted: boolean;
  public readonly transient: boolean;
  public readonly protocolError: boolean;

  public constructor(
    message: string,
    options: {
      status?: number;
      code?: string | number;
      meta?: unknown;
      retryAfterMs?: number;
      aborted?: boolean;
      transient?: boolean;
      protocolError?: boolean;
      cause?: unknown;
    } = {},
  ) {
    super(message);
    this.name = 'LiveContestTransportError';
    this.status = options.status;
    this.code = options.code;
    this.meta = options.meta;
    this.retryAfterMs = options.retryAfterMs;
    this.aborted = options.aborted ?? false;
    this.transient = options.transient ?? false;
    this.protocolError = options.protocolError ?? false;
    if (options.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

export class HttpLiveContestTransport implements LiveContestTransport {
  private readonly apiClient: LiveContestApiClient;
  private readonly request: LiveContestHttpClient['request'];
  private readonly decodeEventPage: HttpLiveContestTransportOptions['decodeEventPage'];
  private readonly eventSourceFactory: HttpLiveContestTransportOptions['eventSourceFactory'];

  public constructor(options: HttpLiveContestTransportOptions) {
    this.apiClient = options.apiClient;
    this.request = options.request;
    this.decodeEventPage = options.decodeEventPage;
    this.eventSourceFactory = options.eventSourceFactory;
  }

  public async getContest(uk: string): Promise<LiveContestConfig> {
    const response = await this.apiClient.getPublicContest({ uk });
    const contest: srk.Contest = {
      title: response.title,
      startAt: response.startAt,
      duration: response.duration,
      ...(response.frozenDuration ? { frozenDuration: response.frozenDuration } : {}),
      ...(response.banner ? { banner: response.banner } : {}),
      ...(response.refLinks ? { refLinks: response.refLinks } : {}),
    };
    return {
      uk: response.uk,
      name: response.name,
      contest,
      problems: (response.problems ?? []) as srk.Problem[],
      users: response.users as srk.User[],
      markers: response.markers ?? [],
      series: response.series ?? [],
      sorter: response.sorter ?? undefined,
      contributors: response.contributors,
    };
  }

  public async getStreamState(uk: string, signal: AbortSignal): Promise<LiveContestStreamState> {
    try {
      return await this.apiClient.getPublicContestEventStream({ uk }, { signal });
    } catch (error) {
      throw normalizeRequestError(error, {
        aborted: signal.aborted,
        message: 'Failed to load contest event stream state',
      });
    }
  }

  public async getEvents(options: {
    uk: string;
    afterEventId: number;
    streamRevision: number;
    signal: AbortSignal;
  }): Promise<LiveContestEventPage> {
    let response: AxiosResponse<ArrayBuffer>;
    try {
      response = await this.request({
        method: 'GET',
        url: `/v2/public/contests/${encodeURIComponent(options.uk)}/events`,
        params: {
          afterEventId: options.afterEventId,
          limit: 1000,
          streamRevision: options.streamRevision,
          compactProgress: true,
        },
        headers: {
          Accept: 'application/protobuf',
        },
        responseType: 'arraybuffer',
        signal: options.signal,
        validateStatus: () => true,
      });
    } catch (error) {
      throw normalizeRequestError(error, {
        aborted: options.signal.aborted,
        message: 'Failed to load contest event page',
      });
    }

    const successHeader = getHeader(response.headers, 'x-rl-resp-success');
    if (response.status >= 400 || successHeader === 'false') {
      throw createResponseError(response);
    }

    const contentType = (getHeader(response.headers, 'content-type') || '').split(';', 1)[0].trim().toLowerCase();
    if (successHeader !== 'true' || !PROTOBUF_CONTENT_TYPES.has(contentType)) {
      throw new LiveContestTransportError(
        `Expected a successful protobuf response, got HTTP ${response.status} ${contentType || 'without content type'}`,
        {
          status: response.status,
          protocolError: true,
        },
      );
    }

    try {
      return await this.decodeEventPage(toUint8Array(response.data));
    } catch (error) {
      throw new LiveContestTransportError('Failed to decode contest event protobuf response', {
        status: response.status,
        protocolError: true,
        cause: error,
      });
    }
  }

  public subscribeEvents(
    uk: string,
    callbacks: {
      onAvailable: (payload: LiveContestEventsAvailable) => void;
      onError: (error: Event) => void;
    },
  ): LiveContestEventSubscription {
    const source = this.eventSourceFactory(
      `/api/v2/public/contests/${encodeURIComponent(uk)}/event-stream/notifications`,
    );
    source.addEventListener('events-available', (event) => {
      try {
        const payload = JSON.parse(event.data) as Partial<LiveContestEventsAvailable>;
        if (
          payload.uk === uk
          && Number.isInteger(payload.latestEventId)
          && (payload.latestEventId ?? -1) >= 0
          && Number.isInteger(payload.streamRevision)
          && (payload.streamRevision ?? 0) >= 1
        ) {
          callbacks.onAvailable(payload as LiveContestEventsAvailable);
        } else {
          console.warn('[LiveContestTransport] ignored invalid events-available payload', payload);
        }
      } catch (error) {
        console.warn('[LiveContestTransport] ignored malformed events-available payload', error);
      }
    });
    source.addEventListener('error', callbacks.onError);
    return {
      close: () => source.close(),
    };
  }
}

function createResponseError(response: AxiosResponse<ArrayBuffer>) {
  const code = normalizeErrorCode(getHeader(response.headers, 'x-rl-resp-code'));
  const message = decodeHeaderValue(getHeader(response.headers, 'x-rl-resp-msg'))
    || `Contest event catch-up failed with HTTP ${response.status}`;
  return new LiveContestTransportError(
    code === undefined ? message : `code ${code}: ${message}`,
    {
      status: response.status,
      code,
      meta: parseMetaHeader(getHeader(response.headers, 'x-rl-resp-meta')),
      retryAfterMs: parseRetryAfter(getHeader(response.headers, 'retry-after')),
      transient: response.status === 429 || response.status >= 500,
    },
  );
}

function normalizeRequestError(
  error: unknown,
  options: {
    aborted: boolean;
    message: string;
  },
) {
  if (error instanceof LiveContestTransportError) {
    return error;
  }
  const candidate = error as {
    code?: unknown;
    message?: unknown;
    name?: unknown;
    response?: {
      status?: unknown;
      headers?: AxiosResponse['headers'];
    };
    status?: unknown;
  };
  const status = typeof candidate?.status === 'number'
    ? candidate.status
    : typeof candidate?.response?.status === 'number'
      ? candidate.response.status
      : undefined;
  const code = typeof candidate?.code === 'string' || typeof candidate?.code === 'number'
    ? candidate.code
    : undefined;
  const aborted = options.aborted
    || candidate?.name === 'AbortError'
    || candidate?.name === 'CanceledError'
    || candidate?.code === 'ERR_CANCELED';
  const networkFailure = status === undefined && (
    candidate?.name === 'AxiosError'
    || candidate?.name === 'TypeError'
    || typeof candidate?.code === 'string'
  );
  return new LiveContestTransportError(
    typeof candidate?.message === 'string' ? candidate.message : options.message,
    {
      status,
      code,
      retryAfterMs: parseRetryAfter(
        getHeader(candidate?.response?.headers, 'retry-after'),
      ),
      aborted,
      transient: !aborted && (
        status === 429
        || (status !== undefined && status >= 500)
        || networkFailure
      ),
      cause: error,
    },
  );
}

function getHeader(headers: AxiosResponse['headers'] | undefined, name: string): string | undefined {
  const getter = headers as { get?: (key: string) => unknown };
  const value = typeof getter?.get === 'function'
    ? getter.get(name)
    : headers?.[name] ?? headers?.[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value.join(',');
  }
  return value === undefined || value === null ? undefined : String(value);
}

function normalizeErrorCode(value: string | undefined): string | number | undefined {
  if (!value) {
    return undefined;
  }
  if (!/^-?\d+$/.test(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : value;
}

function decodeHeaderValue(value: string | undefined) {
  if (!value) {
    return undefined;
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseMetaHeader(value: string | undefined) {
  const decoded = decodeHeaderValue(value);
  if (!decoded) {
    return undefined;
  }
  try {
    return JSON.parse(decoded);
  } catch {
    return decoded;
  }
}

function parseRetryAfter(value: string | undefined) {
  if (!value) {
    return undefined;
  }
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }
  const retryAt = Date.parse(value);
  return Number.isFinite(retryAt) ? Math.max(0, retryAt - Date.now()) : undefined;
}

function toUint8Array(data: ArrayBuffer | Uint8Array) {
  if (data instanceof Uint8Array) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  throw new TypeError('Expected protobuf response body to be ArrayBuffer or Uint8Array');
}
