import { describe, expect, it } from 'vitest';
import type * as srk from '@algoux/standard-ranklist';
import { findUserMatchedMainICPCSeries } from './ranklist.util';

const openSeries: srk.RankSeries = {
  title: 'Open',
  rule: { preset: 'ICPC', options: { count: { value: [] } } },
};

const girlsSeries: srk.RankSeries = {
  title: 'Girls',
  rule: { preset: 'ICPC', options: { filter: { byMarker: 'girls' }, count: { value: [] } } },
};

const nonIcpcSeries: srk.RankSeries = {
  title: 'Score',
  rule: { preset: 'Normal', options: {} },
};

describe('findUserMatchedMainICPCSeries', () => {
  it('prefers a marker-specific ICPC series matching the user marker', () => {
    const matched = findUserMatchedMainICPCSeries(
      [nonIcpcSeries, girlsSeries, openSeries],
      [{ id: 'girls', label: 'Girls', style: 'pink' }],
    );

    expect(matched).toBe(girlsSeries);
  });

  it('falls back to the first unfiltered ICPC series', () => {
    const matched = findUserMatchedMainICPCSeries([girlsSeries, openSeries], []);

    expect(matched).toBe(openSeries);
  });

  it('requires the fixed marker to be present on the user', () => {
    expect(findUserMatchedMainICPCSeries([girlsSeries, openSeries], [], 'girls')).toBeUndefined();
    expect(
      findUserMatchedMainICPCSeries([girlsSeries, openSeries], [{ id: 'girls', label: 'Girls', style: 'pink' }], 'girls'),
    ).toBe(girlsSeries);
  });
});
