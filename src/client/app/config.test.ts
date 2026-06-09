import { describe, expect, it } from 'vitest';
import {
  getFullUrl,
  getRanklandRuntimeConfig,
  ranklandRoutes,
  ranklandSiteOrigin,
} from './config';

describe('rankland runtime config', () => {
  it('provides production-safe defaults for external services', () => {
    const config = getRanklandRuntimeConfig();

    expect(config.apiBaseClient).toBe('https://rl-api.algoux.cn');
    expect(config.cdnApiBaseServer).toBe('https://rl-api.algoux.cn');
    expect(config.hostGlobal).toBe('rl.algoux.org');
    expect(config.hostCN).toBe('rl.algoux.cn');
    expect(config.livePollingInterval).toBe(10_000);
  });

  it('uses runtime environment overrides when provided by the server process', () => {
    const config = getRanklandRuntimeConfig({
      API_BASE_SERVER: 'http://runtime-api',
      CDN_API_BASE_SERVER: 'http://runtime-cdn',
      SITE_ALIAS: 'cnn',
      GTAG: 'G-RUNTIME',
    });

    expect(config.apiBaseServer).toBe('http://runtime-api');
    expect(config.cdnApiBaseServer).toBe('http://runtime-cdn');
    expect(config.siteAlias).toBe('cnn');
    expect(config.gtag).toBe('G-RUNTIME');
  });

  it('formats known rankland routes and full URLs', () => {
    expect(ranklandRoutes.formatUrl('Search', { kw: 'hello world' })).toBe('/search?kw=hello%20world');
    expect(ranklandRoutes.formatUrl('Search', { tag: ['a', 'b'] })).toBe('/search?tag=a&tag=b');
    expect(ranklandRoutes.formatUrl('Collection', { id: 'official', rankId: 'abc' })).toBe('/collection/official?rankId=abc');
    expect(ranklandSiteOrigin('cnn')).toBe('https://rl.algoux.cn');
    expect(getFullUrl('/ranklist/foo')).toBe('https://rl.algoux.org/ranklist/foo');
  });
});
