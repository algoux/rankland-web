import { Inject, Provide } from 'bwcx-core';
import RanklistService from '@server/modules/ranklist/ranklist.service';
import type { IApiRanklistInfo } from '@server/modules/ranklist/ranklist.service';
import { SITEMAP_SITE_ORIGIN } from '@server/modules/sitemap/sitemap.constants';

export const RANKLIST_RSS_ITEM_LIMIT = 50;

@Provide()
export default class RssService {
  public constructor(
    @Inject(RanklistService)
    private readonly ranklistService: RanklistService,
  ) {}

  public async getRanklistRssXml() {
    const ranklists = await this.ranklistService.getAllRanklists();
    const items = ranklists
      .filter((ranklist) => ranklist.uniqueKey.trim())
      .slice(0, RANKLIST_RSS_ITEM_LIMIT)
      .map(formatRanklistItemXml);

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0">',
      '<channel>',
      '<title>RankLand 榜单更新</title>',
      `<link>${escapeXml(SITEMAP_SITE_ORIGIN)}</link>`,
      '<description>RankLand 榜单数据更新订阅</description>',
      ...items,
      '</channel>',
      '</rss>',
      '',
    ].join('\n');
  }
}

function formatRanklistItemXml(ranklist: IApiRanklistInfo) {
  const uniqueKey = ranklist.uniqueKey.trim();
  const title = ranklist.name.trim() || uniqueKey;
  const ranklistUrl = `${SITEMAP_SITE_ORIGIN}/ranklist/${encodeURIComponent(uniqueKey)}`;
  const date = resolveRanklistDate(ranklist);
  const lines = [
    '<item>',
    `<title>${escapeXml(title)}</title>`,
    `<link>${escapeXml(ranklistUrl)}</link>`,
    `<guid isPermaLink="false">${escapeXml(`rankland:ranklist:${uniqueKey}`)}</guid>`,
    `<description>${escapeXml(formatDescription(title, date?.source))}</description>`,
  ];

  if (date) {
    lines.push(`<pubDate>${escapeXml(date.date.toUTCString())}</pubDate>`);
  }

  lines.push('</item>');
  return lines.join('\n');
}

function resolveRanklistDate(ranklist: IApiRanklistInfo) {
  const updatedAt = parseValidDate(ranklist.updatedAt);
  if (updatedAt) {
    return { date: updatedAt, source: ranklist.updatedAt };
  }

  const createdAt = parseValidDate(ranklist.createdAt);
  if (createdAt) {
    return { date: createdAt, source: ranklist.createdAt };
  }

  return undefined;
}

function parseValidDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDescription(title: string, dateSource?: string) {
  return dateSource ? `${title} 更新于 ${dateSource}` : `${title} 已更新`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
