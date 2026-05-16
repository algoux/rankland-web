import { describe, expect, it, vi } from 'vitest';
import {
  RanklandApiException,
  RanklandApiService,
  RanklandHttpException,
  RanklandLogicException,
  RanklandLogicExceptionKind,
  type RanklandApiRequestAdapter,
} from '@common/rankland-api';

type GetMock = ReturnType<typeof vi.fn>;

function makeAdapter(getMock: GetMock): RanklandApiRequestAdapter {
  return { get: getMock };
}

function buildService(opts: { apiGet?: GetMock; cdnGet?: GetMock } = {}) {
  const apiGet = opts.apiGet || vi.fn();
  const cdnGet = opts.cdnGet || vi.fn();
  const service = new RanklandApiService({
    api: makeAdapter(apiGet),
    cdnApi: makeAdapter(cdnGet),
  });
  return { service, apiGet, cdnGet };
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
