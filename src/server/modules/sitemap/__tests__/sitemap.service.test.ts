import { describe, expect, it, vi } from 'vitest';
import HttpException from '@server/exceptions/http.exception';
import {
  SITEMAP_CACHE_KEY,
  SITEMAP_CACHE_TTL_SECONDS,
  SITEMAP_PAGE_SIZE,
  SITEMAP_SITE_ORIGIN,
} from '../sitemap.constants';
import SitemapService from '../sitemap.service';

type FetchMock = ReturnType<typeof vi.fn>;

function createRedis(initial?: string) {
  let value = initial;
  return {
    status: 'ready',
    get: vi.fn(async (_key: string) => value ?? null),
    setex: vi.fn(async (_key: string, _seconds: number, nextValue: string) => {
      value = nextValue;
      return 'OK';
    }),
  };
}

function createFetch(ranks: unknown[]): FetchMock {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({
      code: 0,
      data: { ranks },
    }),
  }));
}

describe('SitemapService', () => {
  it('reverses /rank/listall unique keys before caching them as newline-delimited keys', async () => {
    const redis = createRedis();
    const fetchMock = createFetch([
      { uniqueKey: 'newest-rank', name: 'Newest', fileID: 'f1' },
      { uniqueKey: 'middle-rank', content: '{"ignored":true}' },
      { uniqueKey: 'oldest-rank' },
      { uniqueKey: '' },
      { uniqueKey: 123 },
      {},
    ]);
    const service = new SitemapService(redis as any);

    await expect(service.getRanklistUniqueKeys({ fetchImpl: fetchMock as any })).resolves.toEqual([
      'oldest-rank',
      'middle-rank',
      'newest-rank',
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://rl-api.algoux.cn/rank/listall');
    expect(redis.setex).toHaveBeenCalledWith(
      SITEMAP_CACHE_KEY,
      SITEMAP_CACHE_TTL_SECONDS,
      'oldest-rank\nmiddle-rank\nnewest-rank',
    );
  });

  it('uses cached unique keys without calling the RL API', async () => {
    const redis = createRedis('cached-a\ncached-b');
    const fetchMock = createFetch([]);
    const service = new SitemapService(redis as any);

    await expect(service.getRanklistUniqueKeys({ fetchImpl: fetchMock as any })).resolves.toEqual([
      'cached-a',
      'cached-b',
    ]);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('builds fixed-cn sitemap index and text pages with 10000 locs per file', async () => {
    const keys = Array.from({ length: 20_001 }, (_item, index) => `rank-${index + 1}`);
    const service = new SitemapService(createRedis(keys.join('\n')) as any);

    const indexXml = await service.getSitemapIndexXml();
    expect(indexXml).toContain(`${SITEMAP_SITE_ORIGIN}/sitemap_ranklist_vol_1.txt`);
    expect(indexXml).toContain(`${SITEMAP_SITE_ORIGIN}/sitemap_ranklist_vol_2.txt`);
    expect(indexXml).toContain(`${SITEMAP_SITE_ORIGIN}/sitemap_ranklist_vol_3.txt`);
    expect(indexXml).not.toContain('rl.algoux.org');

    const firstPage = await service.getRanklistSitemapText(1);
    const firstPageLines = firstPage.trimEnd().split('\n');
    expect(firstPageLines).toHaveLength(SITEMAP_PAGE_SIZE);
    expect(firstPageLines[0]).toBe(`${SITEMAP_SITE_ORIGIN}/ranklist/rank-1`);
    expect(firstPageLines.at(-1)).toBe(`${SITEMAP_SITE_ORIGIN}/ranklist/rank-10000`);

    const thirdPage = await service.getRanklistSitemapText(3);
    expect(thirdPage.trimEnd().split('\n')).toEqual([
      `${SITEMAP_SITE_ORIGIN}/ranklist/rank-20001`,
    ]);
  });

  it('URL-encodes unique keys in text sitemap locs', async () => {
    const service = new SitemapService(createRedis('a/b\nx y') as any);

    await expect(service.getRanklistSitemapText(1)).resolves.toBe(
      `${SITEMAP_SITE_ORIGIN}/ranklist/a%2Fb\n${SITEMAP_SITE_ORIGIN}/ranklist/x%20y\n`,
    );
  });

  it('falls back to the RL API when Redis read or write fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const redis = {
      status: 'ready',
      get: vi.fn(async () => {
        throw new Error('redis get failed');
      }),
      setex: vi.fn(async () => {
        throw new Error('redis set failed');
      }),
    };
    const fetchMock = createFetch([{ uniqueKey: 'from-api' }]);
    const service = new SitemapService(redis as any);

    try {
      await expect(service.getRanklistUniqueKeys({ fetchImpl: fetchMock as any })).resolves.toEqual(['from-api']);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
    }
  });

  it('throws HTTP 502 when the RL API cannot provide a cache miss', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: async () => ({}),
    }));
    const service = new SitemapService(createRedis() as any);

    try {
      await expect(service.getRanklistUniqueKeys({ fetchImpl: fetchMock as any })).rejects.toMatchObject<HttpException>({
        code: 502,
      });
    } finally {
      warn.mockRestore();
    }
  });

  it('throws HTTP 404 for pages outside the available sitemap range', async () => {
    const service = new SitemapService(createRedis('only-one') as any);

    await expect(service.getRanklistSitemapText(0)).rejects.toMatchObject<HttpException>({ code: 404 });
    await expect(service.getRanklistSitemapText(2)).rejects.toMatchObject<HttpException>({ code: 404 });
  });
});
