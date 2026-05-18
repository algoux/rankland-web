import { describe, expect, it } from 'vitest';
import type * as srk from '@algoux/standard-ranklist';
import fixture from '../fixtures/ranklist.srk.json';
import {
  getAllRankTimeData,
  getProperRankTimeChunkUnit,
  selectUserMainRankTimeData,
} from '@client/components/rankland-rank-time';
import { convertToStaticRanklist, getSortedCalculatedRawSolutions } from '@algoux/standard-ranklist-utils';

function cloneFixture(): srk.Ranklist {
  return JSON.parse(JSON.stringify(fixture)) as srk.Ranklist;
}

describe('rankland rank-time helpers', () => {
  it('selects the legacy rank-time unit from contest duration', () => {
    expect(getProperRankTimeChunkUnit({ duration: [5, 'h'] } as srk.Contest)).toEqual([1, 'min']);
    expect(getProperRankTimeChunkUnit({ duration: [24, 'h'] } as srk.Contest)).toEqual([5, 'min']);
    expect(getProperRankTimeChunkUnit({ duration: [7, 'd'] } as srk.Contest)).toEqual([1, 'h']);
    expect(getProperRankTimeChunkUnit({ duration: [8, 'd'] } as srk.Contest)).toEqual([1, 'd']);
  });

  it('computes rank-time data for an official user from SRK solutions', () => {
    const ranklist = cloneFixture();
    const rankTimeDataSet = getAllRankTimeData(
      ranklist,
      getSortedCalculatedRawSolutions(ranklist.rows),
      getProperRankTimeChunkUnit(ranklist.contest),
    );
    const staticRanklist = convertToStaticRanklist(ranklist);
    const selected = selectUserMainRankTimeData({
      rankTimeDataSet,
      staticRows: staticRanklist.rows,
      staticSeries: staticRanklist.series,
      staticMarkers: staticRanklist.markers,
      userId: 'team-alpha',
    });

    expect(rankTimeDataSet.unit).toBe('min');
    expect(rankTimeDataSet.totalUsers).toBe(2);
    expect(selected).not.toBeNull();
    expect(selected?.unit).toBe('min');
    expect(selected?.points.length).toBeGreaterThan(0);
    expect(selected?.points[0]).toMatchObject({ time: 0, rank: 1, solved: 0 });
    expect(selected?.points[selected.points.length - 1]).toMatchObject({ time: 300, rank: 1, solved: 2 });
    expect(selected?.solvedEventPoints.map((point) => point.problemAlias)).toEqual(['A', 'B']);
  });

  it('returns null when marker-scoped rank-time data does not match the user', () => {
    const ranklist = cloneFixture();
    ranklist.markers = [
      { id: 'gold', label: 'Gold Group', style: 'gold' },
      { id: 'silver', label: 'Silver Group', style: 'silver' },
    ];
    ranklist.rows[0].user.markers = ['gold'];
    ranklist.series.push({
      title: 'Silver Rank',
      rule: {
        preset: 'ICPC',
        options: {
          filter: {
            byMarker: 'silver',
          },
        },
      },
    });

    const rankTimeDataSet = getAllRankTimeData(
      ranklist,
      getSortedCalculatedRawSolutions(ranklist.rows),
      getProperRankTimeChunkUnit(ranklist.contest),
    );
    const staticRanklist = convertToStaticRanklist(ranklist);

    expect(
      selectUserMainRankTimeData({
        rankTimeDataSet,
        staticRows: staticRanklist.rows,
        staticSeries: staticRanklist.series,
        staticMarkers: staticRanklist.markers,
        userId: 'team-alpha',
        fixedMarker: 'silver',
      }),
    ).toBeNull();
  });
});
