import type { AxiosInstance, AxiosResponse } from 'axios';
import {
  RanklandApiException,
  RanklandHttpException,
  type RanklandApiRequestAdapter,
  type RanklandApiRequestOptions,
} from '@common/rankland-api';

interface RanklandWrappedResponse<T> {
  code: number;
  message?: string;
  msg?: string;
  data: T;
}

function hasOwnCode(body: unknown): body is RanklandWrappedResponse<unknown> {
  return typeof body === 'object' && body !== null && Object.prototype.hasOwnProperty.call(body, 'code');
}

function assertSuccessfulResponse(response: AxiosResponse<unknown>): void {
  if (response.status < 200 || response.status >= 300) {
    throw new RanklandHttpException(response.status, response.statusText || '');
  }
}

function getHeader(headers: unknown, name: string): string | null {
  const lowerName = name.toLowerCase();
  if (headers && typeof (headers as { get?: unknown }).get === 'function') {
    const value = (headers as { get(name: string): unknown }).get(name);
    return typeof value === 'string' ? value : null;
  }

  if (!headers || typeof headers !== 'object') {
    return null;
  }

  const headerRecord = headers as Record<string, unknown>;
  for (const [key, value] of Object.entries(headerRecord)) {
    if (key.toLowerCase() === lowerName) {
      return typeof value === 'string' ? value : null;
    }
  }
  return null;
}

export class AxiosRanklandApiAdapter implements RanklandApiRequestAdapter {
  public constructor(private readonly axios: AxiosInstance) {}

  public async get<T = unknown>(url: string, opts: RanklandApiRequestOptions = {}): Promise<T> {
    try {
      const response = await this.axios.request({
        method: 'GET',
        url,
        ...(opts.getResponse
          ? {
              responseType: 'text' as const,
              transformResponse: [(data: string) => data],
            }
          : {}),
      });

      assertSuccessfulResponse(response);

      if (opts.getResponse) {
        const raw = typeof response.data === 'string' ? response.data : String(response.data ?? '');
        return {
          response: {
            headers: {
              get: (name: string) => getHeader(response.headers, name),
            },
            text: async () => raw,
          },
        } as unknown as T;
      }

      const body = response.data;
      if (!hasOwnCode(body)) {
        return body as T;
      }

      if (body.code !== 0) {
        throw new RanklandApiException(body.code, body.message || body.msg || 'unknown error');
      }

      return body.data as T;
    } catch (error) {
      if (error instanceof RanklandApiException || error instanceof RanklandHttpException) {
        throw error;
      }

      const response = (error as { response?: AxiosResponse<unknown> }).response;
      if (response) {
        throw new RanklandHttpException(response.status, response.statusText || '');
      }

      throw error;
    }
  }
}
