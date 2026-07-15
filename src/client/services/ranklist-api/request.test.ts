import { describe, expect, it, vi } from 'vitest';
import { ApiException, HttpException, createFetchRequestAdapter } from './request';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

describe('createFetchRequestAdapter', () => {
  it('prefixes URLs and unwraps rankland API envelopes', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ code: 0, data: { ok: true } }));
    const adapter = createFetchRequestAdapter({
      baseUrl: 'https://rl-api.algoux.cn/base',
      fetchImpl,
    });

    await expect(adapter.get('/rank/search')).resolves.toEqual({ ok: true });

    expect(fetchImpl.mock.calls[0][0]).toBe('https://rl-api.algoux.cn/base/rank/search');
  });

  it('throws ApiException for non-zero rankland API envelopes', async () => {
    const adapter = createFetchRequestAdapter({
      baseUrl: 'https://rl-api.algoux.cn',
      fetchImpl: vi.fn(async () => jsonResponse({ code: 11, message: 'missing' })),
    });

    await expect(adapter.get('/ranking/nope')).rejects.toBeInstanceOf(ApiException);
  });

  it('returns raw responses for getResponse calls and checks HTTP status', async () => {
    const okAdapter = createFetchRequestAdapter({
      baseUrl: 'https://rl-api.algoux.cn',
      fetchImpl: vi.fn(async () => jsonResponse({ hello: 'world' })),
    });
    const badAdapter = createFetchRequestAdapter({
      baseUrl: 'https://rl-api.algoux.cn',
      fetchImpl: vi.fn(async () => new Response('', { status: 404, statusText: 'Not Found' })),
    });

    await expect(okAdapter.get('/ranking/file?id=fid', { getResponse: true })).resolves.toMatchObject({
      response: expect.any(Response),
    });
    await expect(badAdapter.get('/ranking/file?id=fid', { getResponse: true })).rejects.toBeInstanceOf(HttpException);
  });
});
