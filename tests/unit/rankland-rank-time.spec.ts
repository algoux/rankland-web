import { describe, expect, it } from 'vitest';
import type * as srk from '@algoux/standard-ranklist';
import fixture from '../fixtures/ranklist.srk.json';
import {
  createRankTimeChartModel,
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

  it('builds the legacy G2 rank curve tooltip and animation model', () => {
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

    expect(selected).not.toBeNull();
    const model = createRankTimeChartModel(selected!);

    expect(model.containerHeight).toBe(400);
    expect(model.maxTime).toBe(300);
    expect(model.maxRank).toBe(2);
    expect(model.yTicks).toEqual([1]);
    expect(model.axis).toEqual({
      xTitle: '时间（min）',
      yTitle: '主排名',
    });
    expect(model.lineAnimation).toEqual({
      type: 'pathIn',
      duration: 2000,
    });
    const fortyMinutePoint = selected!.points.find((point) => point.time === 40);
    expect(fortyMinutePoint).toBeDefined();
    expect(model.getLineTooltipTitle(fortyMinutePoint!)).toBe('0:40:00');
    expect(model.getLineTooltipItems(fortyMinutePoint!, 40)).toEqual([
      { name: '主排名', value: 1 },
      { name: '解题数', color: '#64de7c', value: 1 },
    ]);
    expect(model.eventBadges.map((badge) => badge.problemAlias)).toEqual(['A', 'B']);
    expect(model.eventBadges[0].animation.delay).toBeCloseTo(466.66666666666663);
    expect(model.eventBadges[0]).toMatchObject({
      animation: {
        duration: 200,
        type: 'zoomIn',
      },
      fill: '#5b8ff9',
      tooltip: {
        color: '#99ff99',
        name: 'AC',
        value: 'A (0:40:00)',
      },
    });
    expect(model.tooltipInteraction).toEqual({
      darkCrosshairsStroke: '#dadada',
      lightCrosshairsStroke: '#373737',
      crosshairsLineWidth: 1,
    });
  });

  it('keeps the legacy G2 y-axis ticks every 50 ranks up to the capped max rank', () => {
    const model = createRankTimeChartModel({
      unit: 'min',
      points: [
        { time: 0, rank: 1, solved: 0 },
        { time: 1, rank: 42, solved: 1 },
        { time: 2, rank: 90, solved: 2 },
      ],
      solvedEventPoints: [],
      seriesSegments: [],
      totalUsers: 150,
    });

    expect(model.maxRank).toBe(100);
    expect(model.yTicks).toEqual([1, 50, 100]);
  });
});
