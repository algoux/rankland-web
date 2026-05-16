import type { AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { RanklandApiException, RanklandHttpException } from '@common/rankland-api';
import { AxiosRanklandApiAdapter } from '@client/rankland-api';

function makeAdapter(request = vi.fn()) {
  return {
    adapter: new AxiosRanklandApiAdapter({ request } as unknown as AxiosInstance),
    request,
  };
}

describe('AxiosRanklandApiAdapter', () => {
  it('unwraps successful wrapped responses', async () => {
    const data = { id: 'rank-1' };
    const { adapter, request } = makeAdapter(
      vi.fn().mockResolvedValue({ status: 200, statusText: 'OK', data: { code: 0, message: 'success', data } }),
    );

    await expect(adapter.get('/rank/r1')).resolves.toBe(data);
    expect(request).toHaveBeenCalledWith({ method: 'GET', url: '/rank/r1' });
  });

  it('maps wrapped API errors to RanklandApiException', async () => {
    const { adapter } = makeAdapter(
      vi.fn().mockResolvedValue({ status: 200, statusText: 'OK', data: { code: 11, message: 'not found' } }),
    );

    await expect(adapter.get('/rank/missing')).rejects.toMatchObject({
      name: 'RanklandApiException',
      code: 11,
      message: 'RankLand API request failed with code 11: not found',
    });
  });

  it('maps non-2xx resolved responses to RanklandHttpException', async () => {
    const { adapter } = makeAdapter(vi.fn().mockResolvedValue({ status: 500, statusText: 'Internal Error', data: {} }));

    await expect(adapter.get('/broken')).rejects.toMatchObject({
      name: 'RanklandHttpException',
      status: 500,
      message: 'RankLand HTTP request failed: 500 Internal Error',
    });
  });

  it('maps axios HTTP rejections with response to RanklandHttpException', async () => {
    const { adapter } = makeAdapter(
      vi.fn().mockRejectedValue({ response: { status: 404, statusText: 'Not Found', data: 'nope' } }),
    );

    await expect(adapter.get('/missing')).rejects.toBeInstanceOf(RanklandHttpException);
    await expect(adapter.get('/missing')).rejects.toMatchObject({ status: 404 });
  });

  it('returns a raw response wrapper for SRK downloads', async () => {
    const raw = '{"type":"general"}';
    const headers = { 'content-type': 'application/json; charset=utf-8' };
    const { adapter, request } = makeAdapter(
      vi.fn().mockResolvedValue({ status: 200, statusText: 'OK', data: raw, headers }),
    );

    const res = await adapter.get<{ response: { headers: { get(name: string): string | null }; text(): Promise<string> } }>(
      '/file/download?id=fid',
      { getResponse: true },
    );

    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).toMatchObject({
      method: 'GET',
      url: '/file/download?id=fid',
      responseType: 'text',
    });
    expect(request.mock.calls[0][0].transformResponse[0](raw)).toBe(raw);
    expect(res.response.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(res.response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    expect(res.response.headers.get('x-missing')).toBeNull();
    await expect(res.response.text()).resolves.toBe(raw);
  });

  it('treats unwrapped successful data as data', async () => {
    const body = { ranks: [] };
    const { adapter } = makeAdapter(vi.fn().mockResolvedValue({ status: 200, statusText: 'OK', data: body }));

    await expect(adapter.get('/rank/search')).resolves.toBe(body);
  });

  it('throws the RanklandApiException class for wrapped errors using msg', async () => {
    const { adapter } = makeAdapter(vi.fn().mockResolvedValue({ status: 200, data: { code: 42, msg: 'bad request' } }));

    await expect(adapter.get('/bad')).rejects.toBeInstanceOf(RanklandApiException);
    await expect(adapter.get('/bad')).rejects.toMatchObject({
      code: 42,
      message: 'RankLand API request failed with code 42: bad request',
    });
  });
});
