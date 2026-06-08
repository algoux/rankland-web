import type { RanklandRequestAdapter } from './types';

export class ApiException extends Error {
  public code: number;
  public message: string;

  public constructor(code: number, message: string) {
    super(`Request failed with code: ${code}, message: ${message}`);
    this.name = 'ApiException';
    this.code = code;
    this.message = message;
  }
}

export class HttpException extends Error {
  public status: number;

  public constructor(status: number, statusText: string) {
    super(`Request error: ${status} ${statusText}`);
    this.name = 'HttpException';
    this.status = status;
  }
}

interface FetchRequestAdapterOptions {
  baseUrl: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export function createFetchRequestAdapter(options: FetchRequestAdapterOptions): RanklandRequestAdapter {
  const fetchImpl = options.fetchImpl || fetch;
  const timeoutMs = options.timeoutMs || 30_000;

  return {
    async get<T>(url: string, requestOptions?: { getResponse?: boolean }) {
      const response = await fetchWithTimeout(fetchImpl, joinUrl(options.baseUrl, url), timeoutMs);
      if (requestOptions?.getResponse) {
        if (response.status >= 400) {
          throw new HttpException(response.status, response.statusText);
        }
        return {
          data: response.body,
          response,
        };
      }

      let data: any;
      try {
        data = await response.clone().json();
      } catch (e) {
        console.warn('Trying to parse response failed:', e);
      }

      if (typeof data?.code === 'number') {
        if (data.code === 0) {
          return data.data as T;
        }
        throw new ApiException(data.code, data.message);
      }

      throw new HttpException(response.status, response.statusText);
    },
  };
}

async function fetchWithTimeout(fetchImpl: typeof fetch, url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, {
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
