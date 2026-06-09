import axios, { Method } from 'axios';
import { AUTH_TOKEN, BASE_URL, PRODUCER_ID } from './config';

export class DevApiError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
    public readonly code: string | number | undefined,
    public readonly body: unknown,
  ) {
    super(message);
  }
}

export async function requestApi<T>(
  method: Method,
  path: string,
  data?: unknown,
  extraHeaders: Record<string, string> = {},
): Promise<T> {
  const isBinary = Buffer.isBuffer(data) || data instanceof Uint8Array;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...extraHeaders,
  };

  if (!isBinary && data !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await axios.request({
    method,
    url: `${BASE_URL}${path}`,
    data,
    headers,
    validateStatus: () => true,
  });

  const body = response.data;
  const success = body && typeof body === 'object' && (body as any).success;
  if (response.status >= 400 || success === false) {
    const code = body && typeof body === 'object' ? (body as any).code : undefined;
    const msg = body && typeof body === 'object' ? (body as any).msg : undefined;
    throw new DevApiError(
      `${method} ${path} failed: HTTP ${response.status}${code === undefined ? '' : ` code=${code}`}${msg ? ` ${msg}` : ''}`,
      response.status,
      code,
      body,
    );
  }

  if (body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'data')) {
    return (body as any).data as T;
  }
  return body as T;
}

export function authHeaders(): Record<string, string> {
  return { 'x-token': AUTH_TOKEN };
}

export function producerHeaders(): Record<string, string> {
  return {
    ...authHeaders(),
    'x-producer-id': PRODUCER_ID,
  };
}

export function printApiConfig(): void {
  console.log(`dev server: ${BASE_URL}`);
  console.log(`auth token: ${AUTH_TOKEN ? '<set>' : '<empty>'}`);
  console.log(`producer id: ${PRODUCER_ID}`);
}
