import { Inject, Provide } from 'bwcx-core';
import HttpException from '@server/exceptions/http.exception';
import RanklistService from '@server/modules/ranklist/ranklist.service';
import {
  SITEMAP_PAGE_SIZE,
  SITEMAP_SITE_ORIGIN,
} from './sitemap.constants';

@Provide()
export default class SitemapService {
  public constructor(
    @Inject(RanklistService)
    private readonly ranklistService: RanklistService,
  ) {}

  public async getRanklistUniqueKeys(): Promise<string[]> {
    try {
      const ranklists = await this.ranklistService.getAllRanklists();
      return ranklists
        .flatMap((ranklist) => {
          const uniqueKey = ranklist.uniqueKey.trim();
          return uniqueKey ? [uniqueKey] : [];
        })
        .reverse();
    } catch (error) {
      console.warn('[Sitemap] failed to load ranklist list:', error);
      throw new HttpException(502);
    }
  }

  public async getSitemapIndexXml() {
    const keys = await this.getRanklistUniqueKeys();
    const pageCount = getSitemapPageCount(keys.length);
    const sitemapEntries = Array.from({ length: pageCount }, (_item, index) => {
      const loc = `${SITEMAP_SITE_ORIGIN}/sitemap_ranklist_vol_${index + 1}.txt`;
      return `<sitemap><loc>${escapeXml(loc)}</loc></sitemap>`;
    });

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...sitemapEntries,
      '</sitemapindex>',
      '',
    ].join('\n');
  }

  public async getRanklistSitemapText(page: number) {
    if (!Number.isInteger(page) || page < 1) {
      throw new HttpException(404);
    }

    const keys = await this.getRanklistUniqueKeys();
    const pageCount = getSitemapPageCount(keys.length);
    if (page > pageCount) {
      throw new HttpException(404);
    }

    const start = (page - 1) * SITEMAP_PAGE_SIZE;
    const pageKeys = keys.slice(start, start + SITEMAP_PAGE_SIZE);
    return `${pageKeys.map(formatRanklistLoc).join('\n')}\n`;
  }
}

export function getSitemapPageCount(totalUrls: number) {
  return Math.ceil(totalUrls / SITEMAP_PAGE_SIZE);
}

export function formatRanklistLoc(uniqueKey: string) {
  return `${SITEMAP_SITE_ORIGIN}/ranklist/${encodeURIComponent(uniqueKey)}`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
