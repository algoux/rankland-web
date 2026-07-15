import { describe, expect, it } from 'vitest';
import {
  getRanklandBuildCommitLink,
  getFullUrl,
  getRanklandRuntimeConfig,
  RANKLAND_RSS_PATH,
  ranklandRoutes,
  ranklandSiteOrigin,
} from './config';

describe('rankland runtime config', () => {
  it('provides production-safe defaults for external services', () => {
    const config = getRanklandRuntimeConfig();

    expect(config.legacyApiBaseClient).toBe('https://rl-api.algoux.cn');
    expect(config.legacyApiBaseServer).toBe('https://rl-api.algoux.cn');
    expect(config).not.toHaveProperty('apiBaseClient');
    expect(config).not.toHaveProperty('apiBaseServer');
    expect(config).not.toHaveProperty('cdnApiBaseClient');
    expect(config).not.toHaveProperty('cdnApiBaseServer');
    expect(config.hostGlobal).toBe('rl.algoux.org');
    expect(config.hostCN).toBe('rl.algoux.cn');
    expect(config.livePollingInterval).toBe(10_000);
    expect(config.vinUrl).toBe('https://cdn.algoux.cn/rankland/vin.txt');
  });

  it('uses runtime environment overrides when provided by the server process', () => {
    const config = getRanklandRuntimeConfig({
      LEGACY_API_BASE_CLIENT: 'http://client-legacy-api',
      LEGACY_API_BASE_SERVER: 'http://server-legacy-api',
      API_BASE_SERVER: 'http://ignored-old-api',
      CDN_API_BASE_SERVER: 'http://ignored-old-cdn',
      SITE_ALIAS: 'cnn',
      GTAG: 'G-RUNTIME',
      BUILD_COMMIT: '1234567890abcdef',
      VIN_URL: 'https://cdn.example.com/custom-vin.txt',
    });

    expect(config.legacyApiBaseClient).toBe('http://client-legacy-api');
    expect(config.legacyApiBaseServer).toBe('http://server-legacy-api');
    expect(config.siteAlias).toBe('cnn');
    expect(config.gtag).toBe('G-RUNTIME');
    expect(config.buildCommit).toBe('1234567890abcdef');
    expect(config.vinUrl).toBe('https://cdn.example.com/custom-vin.txt');
  });

  it('builds an optional GitHub commit link with an eight-character label', () => {
    expect(getRanklandBuildCommitLink({
      ...getRanklandRuntimeConfig(),
      buildCommit: '1234567890abcdef',
    })).toEqual({
      label: '12345678',
      href: 'https://github.com/algoux/rankland-web/tree/1234567890abcdef',
    });
  });

  it('omits the GitHub commit link when the build commit is absent', () => {
    expect(getRanklandBuildCommitLink({
      ...getRanklandRuntimeConfig(),
      buildCommit: '',
    })).toBeUndefined();
  });

  it('formats known rankland routes and full URLs', () => {
    expect(ranklandRoutes.formatUrl('Search', { kw: 'hello world' })).toBe('/search?kw=hello%20world');
    expect(ranklandRoutes.formatUrl('Search', { tag: ['a', 'b'] })).toBe('/search?tag=a&tag=b');
    expect(ranklandRoutes.formatUrl('Collection', { id: 'official', rankId: 'abc' })).toBe('/collection/official?rankId=abc');
    expect(ranklandRoutes.formatUrl('Playground', {
      src: 'https://example.com/files/file-id.srk.json',
      id: 'rank key',
    })).toBe('/playground?src=https%3A%2F%2Fexample.com%2Ffiles%2Ffile-id.srk.json&id=rank%20key');
    expect(ranklandSiteOrigin('cnn')).toBe('https://rl.algoux.cn');
    expect(getFullUrl('/ranklist/foo')).toBe('https://rl.algoux.org/ranklist/foo');
  });

  it('exposes the relative RSS feed path for client-visible links', () => {
    expect(RANKLAND_RSS_PATH).toBe('/rss.xml');
  });
});
