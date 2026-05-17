import { afterEach, describe, expect, it } from 'vitest';
import { buildHomeAbsoluteUrl, getHomeSiteOrigin } from '@client/modules/home/home-site';

const originalEnv = {
  RANKLAND_SITE_ORIGIN: process.env.RANKLAND_SITE_ORIGIN,
  RANKLAND_SITE_ALIAS: process.env.RANKLAND_SITE_ALIAS,
  SITE_ALIAS: process.env.SITE_ALIAS,
};

function restoreEnv() {
  process.env.RANKLAND_SITE_ORIGIN = originalEnv.RANKLAND_SITE_ORIGIN;
  process.env.RANKLAND_SITE_ALIAS = originalEnv.RANKLAND_SITE_ALIAS;
  process.env.SITE_ALIAS = originalEnv.SITE_ALIAS;
}

describe('home site helpers', () => {
  afterEach(() => {
    restoreEnv();
  });

  it('uses the explicit RankLand site origin when provided', () => {
    process.env.RANKLAND_SITE_ORIGIN = 'https://rankland.example';
    process.env.RANKLAND_SITE_ALIAS = 'cnn';

    expect(getHomeSiteOrigin()).toBe('https://rankland.example');
    expect(buildHomeAbsoluteUrl('/search?kw={search_term_string}')).toBe(
      'https://rankland.example/search?kw={search_term_string}',
    );
  });

  it('uses the China origin for the cnn site alias', () => {
    delete process.env.RANKLAND_SITE_ORIGIN;
    process.env.RANKLAND_SITE_ALIAS = 'cnn';
    delete process.env.SITE_ALIAS;

    expect(getHomeSiteOrigin()).toBe('https://rl.algoux.cn');
  });

  it('falls back to the global RankLand origin', () => {
    delete process.env.RANKLAND_SITE_ORIGIN;
    delete process.env.RANKLAND_SITE_ALIAS;
    delete process.env.SITE_ALIAS;

    expect(getHomeSiteOrigin()).toBe('https://rl.algoux.org');
    expect(buildHomeAbsoluteUrl('collection/official')).toBe('https://rl.algoux.org/collection/official');
  });
});
