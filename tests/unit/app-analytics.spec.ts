import { describe, expect, it } from 'vitest';
import {
  buildRanklandAnalyticsPage,
  getRanklandGaTag,
} from '../../src/client/app-analytics';

describe('app analytics helpers', () => {
  it('uses explicit RankLand and legacy GA tag env values before site alias fallback', () => {
    expect(getRanklandGaTag({ RANKLAND_GTAG: 'G-RANKLAND', GTAG: 'G-LEGACY', SITE_ALIAS: 'cn' })).toBe(
      'G-RANKLAND',
    );
    expect(getRanklandGaTag({ GTAG: 'G-LEGACY', SITE_ALIAS: 'cn' })).toBe('G-LEGACY');
  });

  it('maps the legacy cn site alias to the China GA tag', () => {
    expect(getRanklandGaTag({ SITE_ALIAS: 'cn' })).toBe('G-D4PSNCRQJC');
    expect(getRanklandGaTag({ RANKLAND_SITE_ALIAS: 'cn' })).toBe('G-D4PSNCRQJC');
  });

  it('uses the global GA tag for non-cn aliases and missing aliases', () => {
    expect(getRanklandGaTag({ SITE_ALIAS: 'cnn' })).toBe('G-D6CVTJBDZT');
    expect(getRanklandGaTag({ RANKLAND_SITE_ALIAS: 'global' })).toBe('G-D6CVTJBDZT');
    expect(getRanklandGaTag({})).toBe('G-D6CVTJBDZT');
  });

  it('builds the legacy absolute page URL from origin, path, and query only', () => {
    expect(buildRanklandAnalyticsPage('https://rl.algoux.org', '/search?kw=Hello%202024#ignored')).toBe(
      'https://rl.algoux.org/search?kw=Hello%202024',
    );
    expect(buildRanklandAnalyticsPage('https://rl.algoux.org/', 'playground')).toBe(
      'https://rl.algoux.org/playground',
    );
  });
});
