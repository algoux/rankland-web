import { describe, expect, it, vi } from 'vitest';
import {
  RedisSsrPageCache,
  getSsrPageCacheKey,
  normalizeSsrPageCacheUrl,
  resolveSsrPageCacheTtl,
} from './ssr-page-cache';

describe('SSR page cache keys', () => {
  it('normalizes allowed routes and whitelisted query params before hashing', () => {
    const first = getSsrPageCacheKey('/collection/official?unused=1&rankId=b&focus=yes');
    const second = getSsrPageCacheKey('/collection/official?focus=yes&rankId=b&noise=2');

    expect(first).toBe(second);
    expect(normalizeSsrPageCacheUrl('/collection/official?unused=1&rankId=b&focus=yes')).toBe(
      '/collection/official?focus=yes&rankId=b',
    );
  });

  it('keeps route-specific query params isolated', () => {
    expect(normalizeSsrPageCacheUrl('/search?kw=icpc&rankId=ignored')).toBe('/search?kw=icpc');
    expect(normalizeSsrPageCacheUrl('/live/live-1?token=secret&scrollSolution=1&kw=ignored')).toBe(
      '/live/live-1?scrollSolution=1&token=secret',
    );
    expect(getSsrPageCacheKey('/live/live-1?token=secret')).not.toContain('secret');
  });

  it('does not include the ssr control query flag in cache keys', () => {
    expect(normalizeSsrPageCacheUrl('/ranklist/icpc?focus=yes&ssr=0')).toBe('/ranklist/icpc?focus=yes');
    expect(getSsrPageCacheKey('/ranklist/icpc?ssr=false')).toBe(getSsrPageCacheKey('/ranklist/icpc'));
  });

  it('scopes cache keys by request languages when provided', () => {
    const url = '/ranklist/icpc?focus=yes';
    const urlOnlyKey = getSsrPageCacheKey(url);

    expect(getSsrPageCacheKey(url, { languages: ['zh-CN', 'zh'] })).not.toBe(
      getSsrPageCacheKey(url, { languages: ['en-US', 'en'] }),
    );
    expect(getSsrPageCacheKey(url, { languages: [] })).toBe(urlOnlyKey);
    expect(getSsrPageCacheKey(url, { languages: ['zh-CN'] })).not.toBe(urlOnlyKey);
    expect(getSsrPageCacheKey('/ranklist/icpc?focus=yes&ssr=0', { languages: ['zh-CN'] })).toBe(
      getSsrPageCacheKey('/ranklist/icpc?focus=yes', { languages: ['zh-CN'] }),
    );
  });

  it('skips unknown routes and overly long URLs', () => {
    expect(getSsrPageCacheKey('/unknown?kw=x')).toBeUndefined();
    expect(getSsrPageCacheKey(`/ranklist/${'a'.repeat(2100)}`)).toBeUndefined();
  });
});

describe('SSR page cache TTL', () => {
  it('uses short TTL for 404 pages and normal TTL for successful pages only', () => {
    expect(resolveSsrPageCacheTtl(200)).toBe(60);
    expect(resolveSsrPageCacheTtl(404)).toBe(5);
    expect(resolveSsrPageCacheTtl(500)).toBeUndefined();
    expect(resolveSsrPageCacheTtl(302)).toBeUndefined();
  });
});

describe('RedisSsrPageCache', () => {
  it('round-trips cache payloads through Redis JSON with status-specific TTL', async () => {
    const redis = {
      get: vi.fn(async () => JSON.stringify({ html: '<main/>', status: 404, headers: { 'x-test': '1' } })),
      setex: vi.fn(async () => 'OK'),
    };
    const cache = new RedisSsrPageCache(redis as any);

    await expect(cache.get('rankland:ssr:page:k')).resolves.toEqual({
      html: '<main/>',
      status: 404,
      headers: { 'x-test': '1' },
    });
    await cache.set('rankland:ssr:page:k', { html: '<main/>', status: 404, headers: {} });

    expect(redis.setex).toHaveBeenCalledWith(
      'rankland:ssr:page:k',
      5,
      JSON.stringify({ html: '<main/>', status: 404, headers: {} }),
    );
  });

  it('treats Redis and payload failures as cache misses', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const brokenGet = new RedisSsrPageCache({
      get: vi.fn(async () => {
        throw new Error('redis down');
      }),
      setex: vi.fn(),
    } as any);
    const brokenPayload = new RedisSsrPageCache({
      get: vi.fn(async () => '{bad json'),
      setex: vi.fn(),
    } as any);
    const disallowedStatus = new RedisSsrPageCache({
      get: vi.fn(async () => JSON.stringify({ html: '<main/>', status: 500, headers: {} })),
      setex: vi.fn(),
    } as any);

    try {
      await expect(brokenGet.get('rankland:ssr:page:k')).resolves.toBeUndefined();
      await expect(brokenPayload.get('rankland:ssr:page:k')).resolves.toBeUndefined();
      await expect(disallowedStatus.get('rankland:ssr:page:k')).resolves.toBeUndefined();
    } finally {
      warn.mockRestore();
    }
  });

  it('does not throw when Redis set fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const cache = new RedisSsrPageCache({
      get: vi.fn(),
      setex: vi.fn(async () => {
        throw new Error('redis down');
      }),
    } as any);

    try {
      await expect(cache.set('rankland:ssr:page:k', { html: '<main/>', status: 200, headers: {} })).resolves.toBeUndefined();
    } finally {
      warn.mockRestore();
    }
  });

  it('skips Redis commands while the client is not ready', async () => {
    const redis = {
      status: 'reconnecting',
      get: vi.fn(),
      setex: vi.fn(),
    };
    const cache = new RedisSsrPageCache(redis as any);

    await expect(cache.get('rankland:ssr:page:k')).resolves.toBeUndefined();
    await expect(cache.set('rankland:ssr:page:k', { html: '<main/>', status: 200, headers: {} })).resolves.toBeUndefined();

    expect(redis.get).not.toHaveBeenCalled();
    expect(redis.setex).not.toHaveBeenCalled();
  });
});
