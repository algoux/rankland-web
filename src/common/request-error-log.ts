import Axios from 'axios';
import type { AxiosError } from 'axios';

/** Keep Axios internals out of logs without changing the error used by callers. */
export function formatRequestErrorForLog(error: unknown): unknown {
  if (Axios.isAxiosError(error)) {
    return JSON.stringify(summarizeAxiosError(error));
  }
  // LiveContestTransportError retains the original transport failure as its cause.
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause;
    if (Axios.isAxiosError(cause)) {
      return JSON.stringify({
        name: truncate(error.name, 64),
        message: truncate(error.message, 256),
        cause: summarizeAxiosError(cause),
      });
    }
  }
  return error;
}

function summarizeAxiosError(error: AxiosError) {
  return {
    name: truncate(error.name, 64),
    message: truncate(error.message, 256),
    code: truncate(error.code, 64),
    method: truncate(error.config?.method?.toUpperCase(), 16),
    baseURL: summarizeUrl(error.config?.baseURL, 256),
    url: summarizeUrl(error.config?.url, 512),
    timeout: error.config?.timeout,
    status: error.response?.status,
  };
}

function summarizeUrl(url: string | undefined, maxLength: number) {
  // Query parameters, fragments and URL credentials are not needed to identify the endpoint.
  return truncate(url?.split(/[?#]/, 1)[0].replace(/^(https?:\/\/|\/\/)[^/]*@/i, '$1'), maxLength);
}

function truncate(value: string | undefined, maxLength: number) {
  if (value === undefined || value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 3)}...`;
}
