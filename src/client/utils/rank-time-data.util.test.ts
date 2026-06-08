import { describe, expect, it } from 'vitest';
import type * as srk from '@algoux/standard-ranklist';
import { getProperRankTimeChunkUnit } from './rank-time-data.util';

function contest(duration: srk.TimeDuration): srk.Contest {
  return {
    title: 'Contest',
    startAt: '2026-06-01T09:00:00+08:00',
    duration,
  };
}

describe('getProperRankTimeChunkUnit', () => {
  it('uses source-compatible chunk sizes by contest length', () => {
    expect(getProperRankTimeChunkUnit(contest([5, 'h']))).toEqual([1, 'min']);
    expect(getProperRankTimeChunkUnit(contest([12, 'h']))).toEqual([5, 'min']);
    expect(getProperRankTimeChunkUnit(contest([3, 'd']))).toEqual([1, 'h']);
    expect(getProperRankTimeChunkUnit(contest([14, 'd']))).toEqual([1, 'd']);
  });
});
