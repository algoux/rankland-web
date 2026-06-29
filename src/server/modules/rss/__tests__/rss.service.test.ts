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
  it('builds an RSS 2.0 feed using createdAt in the server timezone', async () => {
    const firstCreatedAt = new Date('2026-06-01T00:00:00.000Z');
    const secondCreatedAt = new Date('2026-05-01T00:00:00.000Z');
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
    expect(xml).toContain(`<description>hello/world · 收录于 ${formatExpectedServerDate(firstCreatedAt)}</description>`);
    expect(xml).toContain(`<pubDate>${formatExpectedRssPubDate(firstCreatedAt)}</pubDate>`);
    expect(xml).toContain('<title>fallback-date</title>');
    expect(xml).toContain(`<description>fallback-date · 收录于 ${formatExpectedServerDate(secondCreatedAt)}</description>`);
    expect(xml).toContain(`<pubDate>${formatExpectedRssPubDate(secondCreatedAt)}</pubDate>`);
    expect(xml).toContain('<title>No Date</title>');
    expect(xml).toContain('<description>no-date · 收录于 </description>');
    expect(xml).not.toContain('2026-06-02T03:04:05.000Z');
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

const RSS_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const RSS_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatExpectedServerDate(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatExpectedRssPubDate(date: Date) {
  return [
    `${RSS_WEEKDAYS[date.getDay()]},`,
    pad2(date.getDate()),
    RSS_MONTHS[date.getMonth()],
    String(date.getFullYear()),
    `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`,
    formatExpectedTimezoneOffset(date),
  ].join(' ');
}

function formatExpectedTimezoneOffset(date: Date) {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffsetMinutes = Math.abs(offsetMinutes);
  return `${sign}${pad2(Math.floor(absOffsetMinutes / 60))}${pad2(absOffsetMinutes % 60)}`;
}

function pad2(value: number) {
  return String(value).padStart(2, '0');
}
