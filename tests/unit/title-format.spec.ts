import { describe, expect, it } from 'vitest';
import { formatTitle } from '@client/utils/title-format.util';

describe('formatTitle', () => {
  it('returns RankLand for no title', () => {
    expect(formatTitle()).toBe('RankLand');
  });

  it('returns RankLand for an empty title', () => {
    expect(formatTitle('')).toBe('RankLand');
  });

  it('returns RankLand for a whitespace title', () => {
    expect(formatTitle('   ')).toBe('RankLand');
  });

  it('appends the site name to a title', () => {
    expect(formatTitle('Test Contest 2024')).toBe('Test Contest 2024 | RankLand');
  });
});
