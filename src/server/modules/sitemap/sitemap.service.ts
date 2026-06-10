import { Inject, Provide } from 'bwcx-core';
import type Redis from 'ioredis';
import HttpException from '@server/exceptions/http.exception';
import { RedisClientId } from '@server/container-ids';
import {
  RANKLAND_API_BASE_SERVER,
  SITEMAP_CACHE_KEY,
  SITEMAP_CACHE_TTL_SECONDS,
  SITEMAP_PAGE_SIZE,
  SITEMAP_SITE_ORIGIN,
} from './sitemap.constants';

type RedisLike = Pick<Redis, 'get' | 'setex'> & { status?: Redis['status'] };
type FetchLike = typeof fetch;

interface SitemapRequestOptions {
  apiBaseServer?: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
}

interface RankListAllResponse {
  code?: number;
  message?: string;
  data?: {
    ranks?: Array<{ uniqueKey?: unknown }>;
  };
}

@Provide()
export default class SitemapService {
  public constructor(
    @Inject(RedisClientId)
    private readonly redis?: RedisLike,
  ) {}

  public async getRanklistUniqueKeys(options: SitemapRequestOptions = {}): Promise<string[]> {
    const cached = await this.readCachedUniqueKeys();
    if (cached) {
      return cached;
    }

    try {
      const keys = await this.fetchRanklistUniqueKeys(options);
      await this.writeCachedUniqueKeys(keys);
      return keys;
    } catch (error) {
      console.warn('[Sitemap] failed to refresh ranklist unique keys:', error);
      throw new HttpException(502);
    }
  }

  public async getSitemapIndexXml(options: SitemapRequestOptions = {}) {
    const keys = await this.getRanklistUniqueKeys(options);
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

  public async getRanklistSitemapText(page: number, options: SitemapRequestOptions = {}) {
    if (!Number.isInteger(page) || page < 1) {
      throw new HttpException(404);
    }

    const keys = await this.getRanklistUniqueKeys(options);
    const pageCount = getSitemapPageCount(keys.length);
    if (page > pageCount) {
      throw new HttpException(404);
    }

    const start = (page - 1) * SITEMAP_PAGE_SIZE;
    const pageKeys = keys.slice(start, start + SITEMAP_PAGE_SIZE);
    return `${pageKeys.map(formatRanklistLoc).join('\n')}\n`;
  }

  private async readCachedUniqueKeys() {
    if (!this.isRedisReady()) {
      return undefined;
    }

    try {
      const cached = await this.redis.get(SITEMAP_CACHE_KEY);
      if (typeof cached !== 'string') {
        return undefined;
      }
      return parseUniqueKeyCache(cached);
    } catch (error) {
      console.warn('[Sitemap] failed to read Redis cache, falling back to RL API:', error);
      return undefined;
    }
  }

  private async writeCachedUniqueKeys(keys: string[]) {
    if (!this.isRedisReady()) {
      return;
    }

    try {
      await this.redis.setex(SITEMAP_CACHE_KEY, SITEMAP_CACHE_TTL_SECONDS, keys.join('\n'));
    } catch (error) {
      console.warn('[Sitemap] failed to write Redis cache, continuing without cache:', error);
    }
  }

  private async fetchRanklistUniqueKeys(options: SitemapRequestOptions) {
    const fetchImpl = options.fetchImpl || fetch;
    const apiBaseServer = options.apiBaseServer || RANKLAND_API_BASE_SERVER;
    const response = await fetchWithTimeout(
      fetchImpl,
      joinUrl(apiBaseServer, '/rank/listall'),
      options.timeoutMs || 5_000,
    );

    if (!response.ok) {
      throw new Error(`RL API responded with ${response.status} ${response.statusText}`);
    }

    const payload = await response.json() as RankListAllResponse;
    if (payload.code !== 0 || !Array.isArray(payload.data?.ranks)) {
      throw new Error(`RL API returned an invalid /rank/listall payload: ${payload.message || 'unknown error'}`);
    }

    return payload.data.ranks.flatMap((rank) => {
      if (typeof rank.uniqueKey !== 'string') {
        return [];
      }
      const uniqueKey = rank.uniqueKey.trim();
      return uniqueKey ? [uniqueKey] : [];
    });
  }

  private isRedisReady() {
    return Boolean(this.redis && (!this.redis.status || this.redis.status === 'ready'));
  }
}

export function getSitemapPageCount(totalUrls: number) {
  return Math.ceil(totalUrls / SITEMAP_PAGE_SIZE);
}

export function formatRanklistLoc(uniqueKey: string) {
  return `${SITEMAP_SITE_ORIGIN}/ranklist/${encodeURIComponent(uniqueKey)}`;
}

function parseUniqueKeyCache(cached: string) {
  if (!cached) {
    return [];
  }
  return cached.split('\n').filter((key) => key.length > 0);
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function fetchWithTimeout(fetchImpl: FetchLike, url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function joinUrl(baseUrl: string, pathname: string) {
  return `${baseUrl.replace(/\/+$/, '')}/${pathname.replace(/^\/+/, '')}`;
}
