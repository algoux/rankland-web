import Axios from 'axios';
import createError from 'axios/lib/core/createError';
import { format } from 'node:util';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClientFactory } from './index';

describe('ApiClientFactory', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs a compact Axios failure without dumping request or response objects', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    let requestError: Error;
    const client = ApiClientFactory.createInstance(Axios.create({
      baseURL: 'http://127.0.0.1:3000/api/',
      timeout: 5000,
      headers: { Cookie: 'private-cookie' },
      adapter: async (config) => {
        const request = { body: 'large-request-body'.repeat(1000) };
        const response = {
          config,
          request,
          data: 'large-response-body'.repeat(1000),
          headers: { 'set-cookie': 'private-response-cookie' },
          status: 404,
          statusText: 'Not Found',
        };
        requestError = createError('Request failed with status code 404', config, undefined, request, response);
        throw requestError;
      },
    }));

    const result = client.getPublicContest({ uk: '2026icpc-ec1' });
    await expect(result).rejects.toThrow('Request failed with status code 404');
    await expect(result).rejects.toBe(requestError);

    expect(log).toHaveBeenCalledOnce();
    const output = format(...log.mock.calls[0]);
    expect(output).toContain('[ApiClient] request error');
    expect(output).toContain('Request failed with status code 404');
    expect(output).toContain('/v2/public/contests/2026icpc-ec1');
    expect(output).not.toMatch(/private-cookie|large-request-body|large-response-body|private-response-cookie/);
    expect(output).not.toContain('\n');
    expect(output.length).toBeLessThan(1024);
    expect(JSON.parse(log.mock.calls[0][1])).toMatchObject({
      method: 'GET',
      baseURL: 'http://127.0.0.1:3000/api/',
      timeout: 5000,
      status: 404,
    });
  });

  it('forwards an extra AbortSignal into the Axios request config', async () => {
    const adapter = vi.fn(async (config) => ({
      config,
      data: {
        success: true,
        data: {
          uk: 'summer-2026',
          lastEventId: 12,
          streamRevision: 3,
        },
      },
      headers: {},
      status: 200,
      statusText: 'OK',
    }));
    const client = ApiClientFactory.createInstance(Axios.create({ adapter }));
    const controller = new AbortController();

    await client.getPublicContestEventStream(
      { uk: 'summer-2026' },
      { signal: controller.signal },
    );

    expect(adapter).toHaveBeenCalledOnce();
    expect(adapter.mock.calls[0][0].signal).toBe(controller.signal);
  });
});
