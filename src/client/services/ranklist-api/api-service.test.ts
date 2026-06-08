import { describe, expect, it, vi } from 'vitest';
import { ApiException, HttpException } from './request';
import { LogicException, LogicExceptionKind } from './logic-exception';
import { ApiService } from './api-service';
import type { CacheManager, RanklandRequestAdapter } from './types';

type GetMock = ReturnType<typeof vi.fn>;

function makeAdapter(getMock: GetMock): RanklandRequestAdapter {
  return { get: getMock } as unknown as RanklandRequestAdapter;
}

function makeCache(initial: Record<string, string> = {}): CacheManager {
  const data = new Map(Object.entries(initial));
  return {
    get: vi.fn(async (key: string) => data.get(key)),
    set: vi.fn(async (key: string, value: string) => {
      data.set(key, value);
    }),
    setEx: vi.fn(async (key: string, _seconds: number, value: string) => {
      data.set(key, value);
    }),
    del: vi.fn(async (key: string) => {
      data.delete(key);
    }),
  };
}

function buildService(opts: { apiGet?: GetMock; cdnGet?: GetMock; cacheManager?: CacheManager } = {}) {
  const apiGet = opts.apiGet || vi.fn();
  const cdnGet = opts.cdnGet || vi.fn();
  const service = new ApiService({
    api: makeAdapter(apiGet),
    cdnApi: makeAdapter(cdnGet),
    cacheManager: opts.cacheManager,
  });
  return { service, apiGet, cdnGet };
}

describe('ApiService ranklist API', () => {
  it('caches getRanklistInfo through the injected cache manager', async () => {
    const info = { uniqueKey: 'test-key', fileID: 'f1', name: 'T', id: 'i', viewCnt: 1, content: '', createdAt: '', updatedAt: '' };
    const cache = makeCache();
    const cdnGet = vi.fn().mockResolvedValue(info);
    const { service } = buildService({ cdnGet, cacheManager: cache });

    await expect(service.getRanklistInfo({ uniqueKey: 'test-key' })).resolves.toEqual(info);
    await expect(service.getRanklistInfo({ uniqueKey: 'test-key' })).resolves.toEqual(info);

    expect(cdnGet).toHaveBeenCalledTimes(1);
    expect(cdnGet.mock.calls[0][0]).toBe('/rank/test-key');
    expect(cache.setEx).toHaveBeenCalledWith(
      'rankland_ssr_api_cache:getRanklistInfo:test-key',
      60,
      JSON.stringify(info),
    );
  });

  it('parses application/json srk file responses and caches the plain JSON', async () => {
    const srk = { type: 'general', version: '0.3.12' };
    const cache = makeCache();
    const cdnGet = vi.fn().mockResolvedValue({
      response: {
        headers: {
          get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json; charset=utf-8' : null),
        },
        text: async () => JSON.stringify(srk),
      },
    });
    const { service } = buildService({ cdnGet, cacheManager: cache });

    await expect(service.getSrkFile<typeof srk>({ fileID: 'fid' })).resolves.toEqual(srk);

    expect(cdnGet.mock.calls[0][0]).toBe('/file/download?id=fid');
    expect(cdnGet.mock.calls[0][1]).toEqual({ getResponse: true });
    expect(cache.setEx).toHaveBeenCalledWith(
      'rankland_ssr_api_cache:getSrkFile:fid',
      24 * 60 * 60,
      JSON.stringify(srk),
    );
  });

  it('translates missing ranklists into LogicException(NotFound)', async () => {
    const { service: apiMissing } = buildService({ cdnGet: vi.fn().mockRejectedValue(new ApiException(11, 'not found')) });
    const { service: httpMissing } = buildService({ cdnGet: vi.fn().mockRejectedValue(new HttpException(404, 'Not Found')) });

    await expect(apiMissing.getRanklist({ uniqueKey: 'k' })).rejects.toMatchObject({
      name: 'LogicException',
      kind: LogicExceptionKind.NotFound,
    });
    await expect(httpMissing.getRanklist({ uniqueKey: 'k' })).rejects.toBeInstanceOf(LogicException);
  });

  it('translates missing collections into LogicException(NotFound)', async () => {
    const { service: apiMissing } = buildService({ cdnGet: vi.fn().mockRejectedValue(new ApiException(11, 'not found')) });
    const { service: httpMissing } = buildService({ cdnGet: vi.fn().mockRejectedValue(new HttpException(404, 'Not Found')) });

    await expect(apiMissing.getCollection({ uniqueKey: 'missing' })).rejects.toMatchObject({
      name: 'LogicException',
      kind: LogicExceptionKind.NotFound,
    });
    await expect(httpMissing.getCollection({ uniqueKey: 'missing' })).rejects.toBeInstanceOf(LogicException);
  });

  it('translates missing live ranklist info into LogicException(NotFound)', async () => {
    const { service: apiMissing } = buildService({ apiGet: vi.fn().mockRejectedValue(new ApiException(11, 'not found')) });
    const { service: httpMissing } = buildService({ apiGet: vi.fn().mockRejectedValue(new HttpException(404, 'Not Found')) });

    await expect(apiMissing.getLiveRanklistInfo({ uniqueKey: 'missing-live' })).rejects.toMatchObject({
      name: 'LogicException',
      kind: LogicExceptionKind.NotFound,
    });
    await expect(httpMissing.getLiveRanklistInfo({ uniqueKey: 'missing-live' })).rejects.toBeInstanceOf(LogicException);
  });

  it('uses the same route shapes as rankland-fe', async () => {
    const apiGet = vi.fn().mockResolvedValue({ ranks: [] });
    const { service } = buildService({ apiGet });

    await service.searchRanklist({ kw: 'hello' });
    await service.listAllRanklists();
    await service.getLiveRanklistInfo({ uniqueKey: 'live-key' });
    await service.getLiveRanklist({ id: 'live-id', token: 't0k3n' });

    expect(apiGet.mock.calls[0][0]).toBe('/rank/search?query=hello');
    expect(apiGet.mock.calls[1][0]).toBe('/rank/listall');
    expect(apiGet.mock.calls[2][0]).toMatch(/^\/ranking\/config\/live-key\?_t=\d+$/);
    expect(apiGet.mock.calls[3][0]).toMatch(/^\/ranking\/live-id\?token=t0k3n&_t=\d+$/);
  });
});
