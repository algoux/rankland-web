import { describe, expect, it, vi } from 'vitest';
import type { IApiRanklistInfo } from '@server/modules/ranklist/ranklist.service';
import { SITEMAP_SITE_ORIGIN } from '@server/modules/sitemap/sitemap.constants';
import RssService from '../rss.service';

function makeRank(patch: Partial<IApiRanklistInfo> & Pick<IApiRanklistInfo, 'uniqueKey'>): IApiRanklistInfo {
  return {
    id: patch.uniqueKey,
    uniqueKey: patch.uniqueKey,
    name: patch.name ?? patch.uniqueKey,
    fileID: `${patch.uniqueKey}-file`,
    viewCnt: 0,
    content: '{}',
    createdAt: patch.createdAt ?? '2026-06-01T00:00:00.000Z',
    updatedAt: patch.updatedAt ?? '2026-06-02T03:04:05.000Z',
  };
}

describe('RssService', () => {
  it('builds an RSS 2.0 feed from recent ranklists returned by the shared list service', async () => {
    const ranklistService = {
      getAllRanklists: vi.fn(async () => [
        makeRank({
          uniqueKey: 'hello/world',
          name: 'A&B <Contest>',
          updatedAt: '2026-06-02T03:04:05.000Z',
        }),
        makeRank({
          uniqueKey: 'fallback-date',
          name: '',
          updatedAt: 'not-a-date',
          createdAt: '2026-05-01T00:00:00.000Z',
        }),
        makeRank({
          uniqueKey: 'no-date',
          name: 'No Date',
          updatedAt: 'not-a-date',
          createdAt: 'also-not-a-date',
        }),
      ]),
    };
    const service = new RssService(ranklistService as any);

    const xml = await service.getRanklistRssXml();

    expect(ranklistService.getAllRanklists).toHaveBeenCalledTimes(1);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0">');
    expect(xml).toContain('<title>RankLand 榜单更新</title>');
    expect(xml).toContain(`<link>${SITEMAP_SITE_ORIGIN}</link>`);
    expect(xml).toContain('<title>A&amp;B &lt;Contest&gt;</title>');
    expect(xml).toContain(`<link>${SITEMAP_SITE_ORIGIN}/ranklist/hello%2Fworld</link>`);
    expect(xml).toContain('<guid isPermaLink="false">rankland:ranklist:hello/world</guid>');
    expect(xml).toContain('<description>A&amp;B &lt;Contest&gt; 更新于 2026-06-02T03:04:05.000Z</description>');
    expect(xml).toContain('<pubDate>Tue, 02 Jun 2026 03:04:05 GMT</pubDate>');
    expect(xml).toContain('<title>fallback-date</title>');
    expect(xml).toContain('<pubDate>Fri, 01 May 2026 00:00:00 GMT</pubDate>');
    expect(xml).toContain('<title>No Date</title>');
    expect(xml).not.toContain('not-a-date');
    expect(xml).not.toContain('also-not-a-date');
  });

  it('limits the RSS feed to the first 50 ranklists in API order', async () => {
    const ranklistService = {
      getAllRanklists: vi.fn(async () => Array.from({ length: 55 }, (_item, index) => makeRank({
        uniqueKey: `rank-${index + 1}`,
        name: `Rank ${index + 1}`,
      }))),
    };
    const service = new RssService(ranklistService as any);

    const xml = await service.getRanklistRssXml();

    expect(xml.match(/<item>/g)).toHaveLength(50);
    expect(xml).toContain('<title>Rank 1</title>');
    expect(xml).toContain('<title>Rank 50</title>');
    expect(xml).not.toContain('<title>Rank 51</title>');
    expect(xml).not.toContain('<title>Rank 55</title>');
  });
});
