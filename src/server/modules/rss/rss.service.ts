import { Inject, Provide } from 'bwcx-core';
import RanklistService from '@server/modules/ranklist/ranklist.service';
import type { IApiRanklistInfo } from '@server/modules/ranklist/ranklist.service';
import { SITEMAP_SITE_ORIGIN } from '@server/modules/sitemap/sitemap.constants';

export const RANKLIST_RSS_ITEM_LIMIT = 50;
const RSS_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const RSS_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
  const createdAt = parseValidDate(ranklist.createdAt);
  const lines = [
    '<item>',
    `<title>${escapeXml(title)}</title>`,
    `<link>${escapeXml(ranklistUrl)}</link>`,
    `<guid isPermaLink="false">${escapeXml(`rankland:ranklist:${uniqueKey}`)}</guid>`,
    `<description>${escapeXml(formatDescription(uniqueKey, createdAt))}</description>`,
  ];

  if (createdAt) {
    lines.push(`<pubDate>${escapeXml(formatRssPubDate(createdAt))}</pubDate>`);
  }

  lines.push('</item>');
  return lines.join('\n');
}

function parseValidDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDescription(uniqueKey: string, createdAt?: Date) {
  return `${uniqueKey} · 收录于 ${createdAt ? formatServerDate(createdAt) : ''}`;
}

function formatServerDate(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatRssPubDate(date: Date) {
  return [
    `${RSS_WEEKDAYS[date.getDay()]},`,
    pad2(date.getDate()),
    RSS_MONTHS[date.getMonth()],
    String(date.getFullYear()),
    `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`,
    formatTimezoneOffset(date),
  ].join(' ');
}

function formatTimezoneOffset(date: Date) {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffsetMinutes = Math.abs(offsetMinutes);
  return `${sign}${pad2(Math.floor(absOffsetMinutes / 60))}${pad2(absOffsetMinutes % 60)}`;
}

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
