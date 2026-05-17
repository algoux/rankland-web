import { describe, expect, it, vi } from 'vitest';
import {
  RanklandApiException,
  RanklandApiService,
  RanklandHttpException,
  RanklandLogicException,
  RanklandLogicExceptionKind,
  type RanklandApiCache,
  type RanklandApiRequestAdapter,
} from '@common/rankland-api';

type GetMock = ReturnType<typeof vi.fn>;

function makeAdapter(getMock: GetMock): RanklandApiRequestAdapter {
  return { get: getMock };
}

function buildService(opts: { apiGet?: GetMock; cdnGet?: GetMock; cache?: RanklandApiCache } = {}) {
  const apiGet = opts.apiGet || vi.fn();
  const cdnGet = opts.cdnGet || vi.fn();
  const service = new RanklandApiService({
    api: makeAdapter(apiGet),
    cdnApi: makeAdapter(cdnGet),
    cache: opts.cache,
  });
  return { service, apiGet, cdnGet };
}

function makeCache(opts: Partial<RanklandApiCache> = {}): RanklandApiCache {
  return {
    get: vi.fn().mockResolvedValue(undefined),
    setEx: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
    ...opts,
  };
}

describe('RanklandApiService.getRanklistInfo', () => {
  it('requests /rank/:key on the CDN adapter and returns the info', async () => {
    const info = {
      id: 'i',
      uniqueKey: 'test-key',
      name: 'T',
      fileID: 'f1',
      viewCnt: 1,
      content: '',
      createdAt: '2026-05-16T00:00:00.000Z',
      updatedAt: '2026-05-16T00:00:00.000Z',
    };
    const cdnGet = vi.fn().mockResolvedValue(info);
    const { service } = buildService({ cdnGet });

    const res = await service.getRanklistInfo({ uniqueKey: 'test-key' });

    expect(res).toBe(info);
    expect(cdnGet).toHaveBeenCalledTimes(1);
    expect(cdnGet.mock.calls[0][0]).toBe('/rank/test-key');
  });

  it('returns cached ranklist info without requesting CDN', async () => {
    const info = {
      id: 'i',
      uniqueKey: 'test-key',
      name: 'T',
      fileID: 'f1',
      viewCnt: 1,
      content: '',
      createdAt: '2026-05-16T00:00:00.000Z',
      updatedAt: '2026-05-16T00:00:00.000Z',
    };
    const cache = makeCache({ get: vi.fn().mockResolvedValue(JSON.stringify(info)) });
    const cdnGet = vi.fn();
    const { service } = buildService({ cdnGet, cache });

    const res = await service.getRanklistInfo({ uniqueKey: 'test-key' });

    expect(res).toEqual(info);
    expect(cdnGet).not.toHaveBeenCalled();
    expect(cache.get).toHaveBeenCalledWith('rankland_ssr_api_cache:getRanklistInfo:test-key');
  });

  it('caches fetched ranklist info for 60 seconds', async () => {
    const info = {
      id: 'i',
      uniqueKey: 'test-key',
      name: 'T',
      fileID: 'f1',
      viewCnt: 1,
      content: '',
      createdAt: '2026-05-16T00:00:00.000Z',
      updatedAt: '2026-05-16T00:00:00.000Z',
    };
    const cache = makeCache();
    const cdnGet = vi.fn().mockResolvedValue(info);
    const { service } = buildService({ cdnGet, cache });

    const res = await service.getRanklistInfo({ uniqueKey: 'test-key' });

    expect(res).toBe(info);
    expect(cache.setEx).toHaveBeenCalledWith(
      'rankland_ssr_api_cache:getRanklistInfo:test-key',
      60,
      JSON.stringify(info),
    );
  });

  it('falls back to CDN when ranklist info cache get fails', async () => {
    const info = {
      id: 'i',
      uniqueKey: 'test-key',
      name: 'T',
      fileID: 'f1',
      viewCnt: 1,
      content: '',
      createdAt: '2026-05-16T00:00:00.000Z',
      updatedAt: '2026-05-16T00:00:00.000Z',
    };
    const cache = makeCache({ get: vi.fn().mockRejectedValue(new Error('cache unavailable')) });
    const cdnGet = vi.fn().mockResolvedValue(info);
    const { service } = buildService({ cdnGet, cache });

    const res = await service.getRanklistInfo({ uniqueKey: 'test-key' });

    expect(res).toBe(info);
    expect(cdnGet).toHaveBeenCalledTimes(1);
  });

  it('returns fetched ranklist info when cache set fails', async () => {
    const info = {
      id: 'i',
      uniqueKey: 'test-key',
      name: 'T',
      fileID: 'f1',
      viewCnt: 1,
      content: '',
      createdAt: '2026-05-16T00:00:00.000Z',
      updatedAt: '2026-05-16T00:00:00.000Z',
    };
    const cache = makeCache({ setEx: vi.fn().mockRejectedValue(new Error('cache write failed')) });
    const cdnGet = vi.fn().mockResolvedValue(info);
    const { service } = buildService({ cdnGet, cache });

    const res = await service.getRanklistInfo({ uniqueKey: 'test-key' });

    expect(res).toBe(info);
  });
});

describe('RanklandApiService.getSrkFile', () => {
  it('parses application/json response into srk object', async () => {
    const srk = { type: 'general', version: '0.3.12' };
    const cdnGet = vi.fn().mockResolvedValue({
      response: {
        headers: {
          get: (h: string) => (h.toLowerCase() === 'content-type' ? 'application/json; charset=utf-8' : null),
        },
        text: async () => JSON.stringify(srk),
      },
    });
    const { service } = buildService({ cdnGet });

    const res = await service.getSrkFile<typeof srk>({ fileID: 'fid' });

    expect(res).toEqual(srk);
    expect(cdnGet.mock.calls[0][0]).toBe('/file/download?id=fid');
    expect(cdnGet.mock.calls[0][1]).toEqual({ getResponse: true });
  });

  it('throws on unknown content type', async () => {
    const cdnGet = vi.fn().mockResolvedValue({
      response: {
        headers: { get: () => 'application/octet-stream' },
        text: async () => '',
      },
    });
    const { service } = buildService({ cdnGet });

    await expect(service.getSrkFile({ fileID: 'fid' })).rejects.toThrow(/Unknown srk content type/);
  });

  it('returns parsed JSON from cached srk file without requesting CDN', async () => {
    const srk = { type: 'general', version: '0.3.12' };
    const cache = makeCache({ get: vi.fn().mockResolvedValue(JSON.stringify(srk)) });
    const cdnGet = vi.fn();
    const { service } = buildService({ cdnGet, cache });

    const res = await service.getSrkFile<typeof srk>({ fileID: 'fid' });

    expect(res).toEqual(srk);
    expect(cdnGet).not.toHaveBeenCalled();
    expect(cache.get).toHaveBeenCalledWith('rankland_ssr_api_cache:getSrkFile:fid');
  });

  it('deletes bad cached srk string and refetches from CDN', async () => {
    const srk = { type: 'general', version: '0.3.12' };
    const cache = makeCache({ get: vi.fn().mockResolvedValue('{bad json') });
    const cdnGet = vi.fn().mockResolvedValue({
      response: {
        headers: { get: () => 'application/json' },
        text: async () => JSON.stringify(srk),
      },
    });
    const { service } = buildService({ cdnGet, cache });

    const res = await service.getSrkFile<typeof srk>({ fileID: 'fid' });

    expect(res).toEqual(srk);
    expect(cache.del).toHaveBeenCalledWith('rankland_ssr_api_cache:getSrkFile:fid');
    expect(cdnGet).toHaveBeenCalledTimes(1);
  });

  it('caches fetched srk raw JSON for 24 hours', async () => {
    const srk = { type: 'general', version: '0.3.12' };
    const raw = JSON.stringify(srk);
    const cache = makeCache();
    const cdnGet = vi.fn().mockResolvedValue({
      response: {
        headers: { get: () => 'application/json' },
        text: async () => raw,
      },
    });
    const { service } = buildService({ cdnGet, cache });

    const res = await service.getSrkFile<typeof srk>({ fileID: 'fid' });

    expect(res).toEqual(srk);
    expect(cache.setEx).toHaveBeenCalledWith('rankland_ssr_api_cache:getSrkFile:fid', 24 * 60 * 60, raw);
  });

  it('falls back to CDN when srk cache get fails', async () => {
    const srk = { type: 'general', version: '0.3.12' };
    const cache = makeCache({ get: vi.fn().mockRejectedValue(new Error('cache unavailable')) });
    const cdnGet = vi.fn().mockResolvedValue({
      response: {
        headers: { get: () => 'application/json' },
        text: async () => JSON.stringify(srk),
      },
    });
    const { service } = buildService({ cdnGet, cache });

    const res = await service.getSrkFile<typeof srk>({ fileID: 'fid' });

    expect(res).toEqual(srk);
    expect(cdnGet).toHaveBeenCalledTimes(1);
  });

  it('refetches bad cached srk when cache delete fails', async () => {
    const srk = { type: 'general', version: '0.3.12' };
    const cache = makeCache({
      get: vi.fn().mockResolvedValue('{bad json'),
      del: vi.fn().mockRejectedValue(new Error('cache delete failed')),
    });
    const cdnGet = vi.fn().mockResolvedValue({
      response: {
        headers: { get: () => 'application/json' },
        text: async () => JSON.stringify(srk),
      },
    });
    const { service } = buildService({ cdnGet, cache });

    const res = await service.getSrkFile<typeof srk>({ fileID: 'fid' });

    expect(res).toEqual(srk);
    expect(cdnGet).toHaveBeenCalledTimes(1);
  });

  it('returns fetched srk when cache set fails', async () => {
    const srk = { type: 'general', version: '0.3.12' };
    const cache = makeCache({ setEx: vi.fn().mockRejectedValue(new Error('cache write failed')) });
    const cdnGet = vi.fn().mockResolvedValue({
      response: {
        headers: { get: () => 'application/json' },
        text: async () => JSON.stringify(srk),
      },
    });
    const { service } = buildService({ cdnGet, cache });

    const res = await service.getSrkFile<typeof srk>({ fileID: 'fid' });

    expect(res).toEqual(srk);
  });
});

describe('RanklandApiService.getRanklist', () => {
  it('combines info + srk into a result object', async () => {
    const info = {
      id: 'i',
      uniqueKey: 'k',
      name: 'T',
      fileID: 'fid',
      viewCnt: 1,
      content: '',
      createdAt: '2026-05-16T00:00:00.000Z',
      updatedAt: '2026-05-16T00:00:00.000Z',
    };
    const srk = { type: 'general', version: '0.3.12' };
    const cdnGet = vi.fn().mockResolvedValueOnce(info).mockResolvedValueOnce({
      response: {
        headers: { get: () => 'application/json' },
        text: async () => JSON.stringify(srk),
      },
    });
    const { service } = buildService({ cdnGet });

    const res = await service.getRanklist({ uniqueKey: 'k' });

    expect(res.info).toEqual(info);
    expect(res.srk).toEqual(srk);
  });

  it('translates RanklandApiException(code=11) into RanklandLogicException(NotFound)', async () => {
    const cdnGet = vi.fn().mockRejectedValue(new RanklandApiException(11, 'not found'));
    const { service } = buildService({ cdnGet });

    await expect(service.getRanklist({ uniqueKey: 'k' })).rejects.toMatchObject({
      name: 'RanklandLogicException',
      kind: RanklandLogicExceptionKind.NotFound,
    });
  });

  it('translates RanklandHttpException(status=404) into RanklandLogicException(NotFound)', async () => {
    const cdnGet = vi.fn().mockRejectedValue(new RanklandHttpException(404, 'Not Found'));
    const { service } = buildService({ cdnGet });

    await expect(service.getRanklist({ uniqueKey: 'k' })).rejects.toBeInstanceOf(RanklandLogicException);
  });

  it('rethrows other exceptions unchanged', async () => {
    const error = new RanklandApiException(99, 'boom');
    const cdnGet = vi.fn().mockRejectedValue(error);
    const { service } = buildService({ cdnGet });

    await expect(service.getRanklist({ uniqueKey: 'k' })).rejects.toBe(error);
  });
});

describe('RanklandApiService.searchRanklist & listAllRanklists', () => {
  it('searchRanklist hits /rank/search with query', async () => {
    const apiGet = vi.fn().mockResolvedValue({ ranks: [] });
    const { service } = buildService({ apiGet });

    await service.searchRanklist({ kw: 'hello' });

    expect(apiGet.mock.calls[0][0]).toBe('/rank/search?query=hello');
  });

  it('listAllRanklists hits /rank/listall', async () => {
    const apiGet = vi.fn().mockResolvedValue({ ranks: [] });
    const { service } = buildService({ apiGet });

    await service.listAllRanklists();

    expect(apiGet.mock.calls[0][0]).toBe('/rank/listall');
  });
});

describe('RanklandApiService.getCollection', () => {
  it('fetches /rank/group/:key on CDN and JSON.parses the content string', async () => {
    const inner = { root: { children: [] } };
    const cdnGet = vi.fn().mockResolvedValue({ content: JSON.stringify(inner) });
    const { service } = buildService({ cdnGet });

    const res = await service.getCollection({ uniqueKey: 'official' });

    expect(res).toEqual(inner);
    expect(cdnGet.mock.calls[0][0]).toBe('/rank/group/official');
  });

  it('returns cached collection content without requesting CDN', async () => {
    const inner = { root: { children: [] } };
    const cache = makeCache({ get: vi.fn().mockResolvedValue(JSON.stringify(inner)) });
    const cdnGet = vi.fn();
    const { service } = buildService({ cdnGet, cache });

    const res = await service.getCollection({ uniqueKey: 'official' });

    expect(res).toEqual(inner);
    expect(cdnGet).not.toHaveBeenCalled();
    expect(cache.get).toHaveBeenCalledWith('rankland_ssr_api_cache:getCollection:official');
  });

  it('caches fetched collection raw content for 2 minutes', async () => {
    const inner = { root: { children: [] } };
    const raw = JSON.stringify(inner);
    const cache = makeCache();
    const cdnGet = vi.fn().mockResolvedValue({ content: raw });
    const { service } = buildService({ cdnGet, cache });

    const res = await service.getCollection({ uniqueKey: 'official' });

    expect(res).toEqual(inner);
    expect(cache.setEx).toHaveBeenCalledWith('rankland_ssr_api_cache:getCollection:official', 2 * 60, raw);
  });

  it('falls back to CDN when collection cache get fails', async () => {
    const inner = { root: { children: [] } };
    const raw = JSON.stringify(inner);
    const cache = makeCache({ get: vi.fn().mockRejectedValue(new Error('cache unavailable')) });
    const cdnGet = vi.fn().mockResolvedValue({ content: raw });
    const { service } = buildService({ cdnGet, cache });

    const res = await service.getCollection({ uniqueKey: 'official' });

    expect(res).toEqual(inner);
    expect(cdnGet).toHaveBeenCalledTimes(1);
  });

  it('returns fetched collection when cache set fails', async () => {
    const inner = { root: { children: [] } };
    const raw = JSON.stringify(inner);
    const cache = makeCache({ setEx: vi.fn().mockRejectedValue(new Error('cache write failed')) });
    const cdnGet = vi.fn().mockResolvedValue({ content: raw });
    const { service } = buildService({ cdnGet, cache });

    const res = await service.getCollection({ uniqueKey: 'official' });

    expect(res).toEqual(inner);
  });

  it('translates RanklandApiException(code=11) into RanklandLogicException(NotFound)', async () => {
    const cdnGet = vi.fn().mockRejectedValue(new RanklandApiException(11, 'Collection not found'));
    const { service } = buildService({ cdnGet });

    await expect(service.getCollection({ uniqueKey: 'missing-collection' })).rejects.toMatchObject({
      name: 'RanklandLogicException',
      kind: RanklandLogicExceptionKind.NotFound,
    });
  });

  it('translates RanklandHttpException(status=404) into RanklandLogicException(NotFound)', async () => {
    const cdnGet = vi.fn().mockRejectedValue(new RanklandHttpException(404, 'Not Found'));
    const { service } = buildService({ cdnGet });

    await expect(service.getCollection({ uniqueKey: 'missing-collection' })).rejects.toMatchObject({
      name: 'RanklandLogicException',
      kind: RanklandLogicExceptionKind.NotFound,
    });
  });
});

describe('RanklandApiService.getStatistics', () => {
  it('hits /statistics', async () => {
    const apiGet = vi.fn().mockResolvedValue({ totalSrkCount: 1, totalViewCount: 2 });
    const { service } = buildService({ apiGet });

    const res = await service.getStatistics();

    expect(res).toEqual({ totalSrkCount: 1, totalViewCount: 2 });
    expect(apiGet.mock.calls[0][0]).toBe('/statistics');
  });
});

describe('RanklandApiService.getLiveRanklistInfo & getLiveRanklist', () => {
  it('getLiveRanklistInfo embeds a cache-busting _t param', async () => {
    const apiGet = vi.fn().mockResolvedValue({ id: 'L', uniqueKey: 'lk' });
    const { service } = buildService({ apiGet });

    await service.getLiveRanklistInfo({ uniqueKey: 'lk' });

    const url = apiGet.mock.calls[0][0] as string;
    expect(url.startsWith('/ranking/config/lk')).toBe(true);
    expect(url).toMatch(/_t=\d+/);
  });

  it('getLiveRanklist passes id and optional token in the URL', async () => {
    const apiGet = vi.fn().mockResolvedValue({});
    const { service } = buildService({ apiGet });

    await service.getLiveRanklist({ id: 'live-id', token: 't0k3n' });

    const url = apiGet.mock.calls[0][0] as string;
    expect(url.startsWith('/ranking/live-id')).toBe(true);
    expect(url).toMatch(/token=t0k3n/);
    expect(url).toMatch(/_t=\d+/);
  });

  it('getLiveRanklist omits token when not provided', async () => {
    const apiGet = vi.fn().mockResolvedValue({});
    const { service } = buildService({ apiGet });

    await service.getLiveRanklist({ id: 'L' });

    const url = apiGet.mock.calls[0][0] as string;
    expect(url).not.toMatch(/token=/);
  });
});
