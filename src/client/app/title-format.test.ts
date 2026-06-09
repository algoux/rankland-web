import { describe, expect, it } from 'vitest';
import { formatTitle } from './title-format';

describe('rankland title formatting', () => {
  it('uses the site name for the home page title', () => {
    expect(formatTitle()).toBe('RankLand');
  });

  it('appends the site name to page-specific titles', () => {
    expect(formatTitle('探索')).toBe('探索 | RankLand');
    expect(formatTitle('ICPC 2026')).toBe('ICPC 2026 | RankLand');
  });
});
