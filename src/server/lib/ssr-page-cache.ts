import crypto from 'crypto';
import { Inject, Provide } from 'bwcx-core';
import type Redis from 'ioredis';
import { SSR_SKIP_CACHE_HEADER } from '@common/ssr-cache';
import { normalizeRequestLanguages } from '@common/request-language';
import { RedisClientId } from '@server/container-ids';

const SSR_PAGE_CACHE_PREFIX = 'rankland:ssr:page:';
const MAX_CACHEABLE_URL_LENGTH = 2048;
const NORMAL_PAGE_TTL_SECONDS = 60;
const NOT_FOUND_PAGE_TTL_SECONDS = 5;
const GLOBAL_QUERY_ALLOWLIST = ['focus', '聚焦'];

export interface SsrPageCachePayload {
  html: string;
  status: number;
  headers: Record<string, string>;
}

export interface SsrPageRenderResult extends SsrPageCachePayload {
  skipCache?: boolean;
}

type RedisLike = Pick<Redis, 'get' | 'setex'> & { status?: Redis['status'] };

interface SsrPageCacheKeyOptions {
  languages?: readonly string[];
}

@Provide()
export class RedisSsrPageCache {
  public constructor(
    @Inject(RedisClientId)
    private readonly redis?: RedisLike,
  ) {}

  public async get(key: string): Promise<SsrPageCachePayload | undefined> {
    if (!this.isReady()) {
      return undefined;
    }
    try {
      const raw = await this.redis.get(key);
      if (!raw) {
        return undefined;
      }
      return parseSsrPageCachePayload(raw);
    } catch (error) {
      console.warn('[SSR cache] read failed, skip cache:', error);
      return undefined;
    }
  }

  public async set(key: string, payload: SsrPageCachePayload): Promise<void> {
    if (!this.isReady()) {
      return;
    }
    const ttl = resolveSsrPageCacheTtl(payload.status);
    if (!ttl) {
      return;
    }
    try {
      await this.redis.setex(key, ttl, JSON.stringify(payload));
    } catch (error) {
      console.warn('[SSR cache] write failed, skip cache:', error);
    }
  }

  private isReady() {
    return Boolean(this.redis && (!this.redis.status || this.redis.status === 'ready'));
  }
}

export function resolveSsrPageCacheTtl(status: number) {
  if (status === 200) {
    return NORMAL_PAGE_TTL_SECONDS;
  }
  if (status === 404) {
    return NOT_FOUND_PAGE_TTL_SECONDS;
  }
  return undefined;
}

export function isSsrPageCacheableStatus(status: number) {
  return resolveSsrPageCacheTtl(status) !== undefined;
}

export function shouldWriteSsrPageCache(payload: SsrPageRenderResult) {
  return !payload.skipCache && isSsrPageCacheableStatus(payload.status);
}

export function logSsrPageCacheHit(url: string) {
  console.info(`[SSR cache] hit: ${url}`);
}

export function sanitizeSsrPageCacheHeaders(headers: Record<string, string> = {}) {
  const sanitized = { ...headers };
  let skipCache = false;
  for (const key of Object.keys(sanitized)) {
    if (key.toLowerCase() === SSR_SKIP_CACHE_HEADER.toLowerCase()) {
      skipCache = skipCache || sanitized[key] === '1';
      delete sanitized[key];
    }
  }
  return { headers: sanitized, skipCache };
}

export function toSsrPageCachePayload(payload: SsrPageRenderResult): SsrPageCachePayload {
  return {
    html: payload.html,
    status: payload.status,
    headers: payload.headers,
  };
}

export function getSsrPageCacheKey(url: string, options: SsrPageCacheKeyOptions = {}) {
  const normalized = normalizeSsrPageCacheUrl(url);
  if (!normalized) {
    return undefined;
  }
  const hash = crypto.createHash('sha256').update(formatSsrPageCacheKeySource(normalized, options)).digest('hex');
  return `${SSR_PAGE_CACHE_PREFIX}${hash}`;
}

function formatSsrPageCacheKeySource(normalizedUrl: string, options: SsrPageCacheKeyOptions) {
  const languages = normalizeRequestLanguages(options.languages);
  if (!languages) {
    return normalizedUrl;
  }
  return JSON.stringify({
    url: normalizedUrl,
    languages,
  });
}

export function normalizeSsrPageCacheUrl(url: string) {
  if (!url || url.length > MAX_CACHEABLE_URL_LENGTH) {
    return undefined;
  }
  let parsed: URL;
  try {
    parsed = new URL(url, 'https://rankland.local');
  } catch (_error) {
    return undefined;
  }

  const routeQueryAllowlist = resolveRouteQueryAllowlist(parsed.pathname);
  if (!routeQueryAllowlist) {
    return undefined;
  }

  const allowedKeys = [...GLOBAL_QUERY_ALLOWLIST, ...routeQueryAllowlist].sort();
  const normalizedQuery = new URLSearchParams();
  for (const key of allowedKeys) {
    const values = parsed.searchParams.getAll(key).sort();
    for (const value of values) {
      normalizedQuery.append(key, value);
    }
  }

  const query = normalizedQuery.toString();
  const normalized = `${parsed.pathname}${query ? `?${query}` : ''}`;
  return normalized.length > MAX_CACHEABLE_URL_LENGTH ? undefined : normalized;
}

function resolveRouteQueryAllowlist(pathname: string) {
  if (pathname === '/') {
    return [];
  }
  if (pathname === '/search') {
    return ['kw'];
  }
  if (/^\/ranklist\/[^/]+$/.test(pathname)) {
    return [];
  }
  if (/^\/collection\/[^/]+$/.test(pathname)) {
    return ['rankId'];
  }
  if (/^\/live\/[^/]+$/.test(pathname)) {
    return ['scrollSolution', 'token'];
  }
  return undefined;
}

function parseSsrPageCachePayload(raw: string): SsrPageCachePayload | undefined {
  const parsed = JSON.parse(raw) as Partial<SsrPageCachePayload>;
  if (
    !parsed
    || typeof parsed.html !== 'string'
    || typeof parsed.status !== 'number'
    || !isSsrPageCacheableStatus(parsed.status)
    || !parsed.headers
    || typeof parsed.headers !== 'object'
  ) {
    return undefined;
  }
  return {
    html: parsed.html,
    status: parsed.status,
    headers: Object.fromEntries(
      Object.entries(parsed.headers)
        .filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
    ),
  };
}
