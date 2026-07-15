import { describe, expect, it, vi } from 'vitest';
import HttpException from '@server/exceptions/http.exception';
import { SITEMAP_PAGE_SIZE, SITEMAP_SITE_ORIGIN } from '../sitemap.constants';
import SitemapService from '../sitemap.service';

function makeRank(uniqueKey: string) {
  return {
    id: uniqueKey,
    uniqueKey,
    name: uniqueKey,
    fileID: `${uniqueKey}-file`,
    viewCnt: 0,
    content: '{}',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-02T00:00:00.000Z',
  };
}

function createRanklistService(uniqueKeys: string[]) {
  return {
    getAllRanklists: vi.fn(async () => uniqueKeys.map(makeRank)),
  };
}

describe('SitemapService', () => {
  it('derives unique keys from the shared ranklist service and reverses newest-first ordering', async () => {
    const ranklistService = createRanklistService(['newest-rank', 'middle-rank', 'oldest-rank']);
    const service = new SitemapService(ranklistService as any);

    await expect(service.getRanklistUniqueKeys()).resolves.toEqual(['oldest-rank', 'middle-rank', 'newest-rank']);

    expect(ranklistService.getAllRanklists).toHaveBeenCalledTimes(1);
  });

  it('builds fixed-cn sitemap index and text pages with 10000 locs per file', async () => {
    const keys = Array.from({ length: 20_001 }, (_item, index) => `rank-${20_001 - index}`);
    const service = new SitemapService(createRanklistService(keys) as any);

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
    expect(thirdPage.trimEnd().split('\n')).toEqual([`${SITEMAP_SITE_ORIGIN}/ranklist/rank-20001`]);
  });

  it('URL-encodes unique keys in text sitemap locs', async () => {
    const service = new SitemapService(createRanklistService(['x y', 'a/b']) as any);

    await expect(service.getRanklistSitemapText(1)).resolves.toBe(
      `${SITEMAP_SITE_ORIGIN}/ranklist/a%2Fb\n${SITEMAP_SITE_ORIGIN}/ranklist/x%20y\n`,
    );
  });

  it('throws HTTP 502 when the shared ranklist service cannot provide data', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const ranklistService = {
      getAllRanklists: vi.fn(async () => {
        throw new Error('upstream failed');
      }),
    };
    const service = new SitemapService(ranklistService as any);

    try {
      await expect(service.getRanklistUniqueKeys()).rejects.toMatchObject<HttpException>({
        code: 502,
      });
    } finally {
      warn.mockRestore();
    }
  });

  it('throws HTTP 404 for pages outside the available sitemap range', async () => {
    const service = new SitemapService(createRanklistService(['only-one']) as any);

    await expect(service.getRanklistSitemapText(0)).rejects.toMatchObject<HttpException>({ code: 404 });
    await expect(service.getRanklistSitemapText(2)).rejects.toMatchObject<HttpException>({ code: 404 });
  });
});
