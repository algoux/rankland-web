import createError from 'axios/lib/core/createError';
import { describe, expect, it } from 'vitest';
import { formatRequestErrorForLog } from '../request-error-log';

describe('formatRequestErrorForLog', () => {
  it.each(['ECONNABORTED', 'ECONNREFUSED', 'ENOTFOUND'])(
    'keeps diagnostics for %s failures without an HTTP response',
    (code) => {
      const error = createError('Request failed', {
        method: 'get',
        baseURL: 'http://127.0.0.1:3000/api/',
        url: '/v2/public/contests/example',
        timeout: 5000,
      }, code);

      expect(JSON.parse(formatRequestErrorForLog(error) as string)).toEqual({
        name: 'Error',
        message: 'Request failed',
        code,
        method: 'GET',
        baseURL: 'http://127.0.0.1:3000/api/',
        url: '/v2/public/contests/example',
        timeout: 5000,
      });
    },
  );

  it('handles Axios errors without request configuration', () => {
    expect(JSON.parse(formatRequestErrorForLog(createError('Network Error')) as string)).toEqual({
      name: 'Error',
      message: 'Network Error',
    });
  });

  it('omits query strings, fragments, credentials and bounds long log fields', () => {
    const error = createError('message\n'.repeat(1000), {
      baseURL: 'https://username:password@example.com/api/?token=secret',
      url: `/contests/${'a'.repeat(10_000)}?token=secret#fragment`,
      params: { token: 'secret' },
    });
    const output = formatRequestErrorForLog(error) as string;
    const summary = JSON.parse(output);

    expect(output).not.toMatch(/username|password|secret|fragment|\n/);
    expect(summary.baseURL).toBe('https://example.com/api/');
    expect(summary.message).toHaveLength(256);
    expect(summary.url).toHaveLength(512);
    expect(output.length).toBeLessThan(1024);
  });

  it('summarizes a wrapped Axios cause while preserving retry and response information', () => {
    const response = {
      status: 503,
      headers: { 'retry-after': '5' },
      data: 'large-body'.repeat(1000),
    };
    const cause = createError('Request failed', {}, 'ERR_NETWORK', undefined, response);
    const error = Object.assign(new Error('Failed to load contest event page'), { cause });
    const summary = JSON.parse(formatRequestErrorForLog(error) as string);

    expect(summary.message).toBe('Failed to load contest event page');
    expect(summary.cause).toEqual({ name: 'Error', message: 'Request failed', code: 'ERR_NETWORK', status: 503 });
    expect(error.cause).toBe(cause);
    expect(cause.response).toBe(response);
    expect(cause.response.headers['retry-after']).toBe('5');
  });

  it.each([new Error('ordinary error'), { reason: 'unknown' }, 'failure', null, undefined])(
    'preserves non-Axios errors unchanged: %s',
    (error) => {
      expect(formatRequestErrorForLog(error)).toBe(error);
    },
  );
});
