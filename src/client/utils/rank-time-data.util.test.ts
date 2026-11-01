import { describe, expect, it } from 'vitest';
import type * as srk from '@algoux/standard-ranklist';
import { getSortedCalculatedRawSolutions } from '@algoux/standard-ranklist-utils';
import { getAllRankTimeData, getProperRankTimeChunkUnit, getUserRankTimeDataAsync } from './rank-time-data.util';

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


function curveFixture(): srk.Ranklist {
  return {
    type: 'general',
    version: '0.3.14',
    contest: { ...contest([150, 's']) },
    problems: [{ alias: 'A' }, { alias: 'B' }],
    markers: [{ id: 'red', label: 'Red' }],
    sorter: { algorithm: 'ICPC', config: {} },
    series: [
      {
        title: 'Overall',
        segments: [{ title: 'Gold', style: 'gold' }, { title: 'Silver', style: 'silver' }],
        rule: { preset: 'ICPC', options: { count: { value: [1, 1] } } },
      },
      {
        title: 'Red',
        segments: [{ title: 'Gold', style: 'gold' }],
        rule: { preset: 'ICPC', options: { count: { value: [1], noTied: true }, filter: { byMarker: 'red' } } },
      },
    ],
    rows: [
      {
        user: { id: 'alpha', name: 'Alpha', marker: 'red' },
        score: { value: 2, time: [22, 'min'] },
        statuses: [
          { result: 'FB', solutions: [{ result: 'FB', time: [30, 's'] }] },
          { result: 'AC', solutions: [{ result: 'WA', time: [65, 's'] }, { result: 'AC', time: [125, 's'] }] },
        ],
      },
      {
        user: { id: 'beta', name: 'Beta' },
        score: { value: 2, time: [1, 'min'] },
        statuses: [
          { result: 'AC', solutions: [{ result: 'AC', time: [30, 's'] }] },
          { result: 'AC', solutions: [{ result: 'AC', time: [90, 's'] }] },
        ],
      },
      {
        user: { id: 'guest', name: 'Guest', official: false, marker: 'red' },
        score: { value: 1, time: [0, 'min'] },
        statuses: [{ result: 'AC', solutions: [{ result: 'AC', time: [15, 's'] }] }, { result: null }],
      },
    ],
  };
}

function serializedCurve(ranklist: srk.Ranklist, unit: srk.TimeDuration) {
  const data = getAllRankTimeData(ranklist, getSortedCalculatedRawSolutions(ranklist.rows), unit);
  return {
    ...data,
    userRankTimePointsList: [...data.userRankTimePointsList],
    userRankTimeSolvedEventPointsList: [...data.userRankTimeSolvedEventPointsList],
  };
}

describe('getAllRankTimeData output contract', () => {
  it('retains only the requested user without changing ranks, sampling, events or award boundaries', () => {
    const ranklist = curveFixture();
    const solutions = getSortedCalculatedRawSolutions(ranklist.rows);
    const full = getAllRankTimeData(ranklist, solutions, [1, 'min']);
    for (const user of ranklist.rows.map((row) => row.user.id)) {
      const selected = getAllRankTimeData(ranklist, solutions, [1, 'min'], user);
      expect([...selected.userRankTimePointsList.keys()]).toEqual([user]);
      expect(selected.userRankTimePointsList.get(user)).toEqual(full.userRankTimePointsList.get(user));
      expect(selected.userRankTimeSolvedEventPointsList.get(user)).toEqual(full.userRankTimeSolvedEventPointsList.get(user));
      expect(selected.seriesSegmentsList).toEqual(full.seriesSegmentsList);
      expect(selected.totalUsers).toBe(full.totalUsers);
    }
  });

  it('yields between sampling steps in the main-thread fallback and cancels stale work', async () => {
    const ranklist = curveFixture();
    const solutions = getSortedCalculatedRawSolutions(ranklist.rows);
    let yields = 0;
    const result = await getUserRankTimeDataAsync(ranklist, solutions, [1, 'min'], 'alpha', {
      yieldControl: async () => { yields++; },
      budgetMs: 0,
    });
    expect(yields).toBeGreaterThan(1);
    expect(result).toEqual(getAllRankTimeData(ranklist, solutions, [1, 'min'], 'alpha'));
    let current = true;
    expect(await getUserRankTimeDataAsync(ranklist, solutions, [1, 'min'], 'alpha', {
      isCurrent: () => current,
      yieldControl: async () => { current = false; },
      budgetMs: 0,
    })).toBeNull();
  });

  it('preserves ties, filtered series, guest exclusion, FB events, segments and a partial final bucket', () => {
    const ranklist = curveFixture();
    const before = JSON.stringify(ranklist);
    const data = getAllRankTimeData(ranklist, getSortedCalculatedRawSolutions(ranklist.rows), [1, 'min']);
    expect(data.userRankTimePointsList.get('alpha')?.[0]).toEqual([
      { time: 0, rank: 1, solved: 0 },
      { time: 1, rank: 1, solved: 1 },
      { time: 2, rank: 2, solved: 1 },
      { time: 2.5, rank: 2, solved: 2 },
    ]);
    expect(data.userRankTimePointsList.get('guest')).toEqual([[], []]);
    expect(data.userRankTimePointsList.get('beta')?.[1]).toEqual([]);
    expect(data.userRankTimePointsList.get('alpha')?.[1].map((point) => point.rank)).toEqual([1, 1, 1, 1]);
    expect(serializedCurve(ranklist, [1, 'min'])).toMatchSnapshot();
    expect(JSON.stringify(ranklist)).toBe(before);
  });

  it('retains each empty sampling interval and independent point objects', () => {
    const ranklist = curveFixture();
    ranklist.contest.duration = [5, 'min'];
    ranklist.rows.forEach((row) => { row.statuses = [{ result: null }, { result: null }]; });
    const data = getAllRankTimeData(ranklist, [], [1, 'min']);
    const points = data.userRankTimePointsList.get('alpha')![0];
    expect(points.map((point) => point.time)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(new Set(points).size).toBe(points.length);
    expect(points.every((point) => point.rank === 1 && point.solved === 0)).toBe(true);
    expect(data.userRankTimeSolvedEventPointsList.size).toBe(0);
    expect(serializedCurve(ranklist, [1, 'min'])).toMatchSnapshot();
  });

  it('keeps ratio-segment boundaries through minutes without new submissions', () => {
    const ranklist = curveFixture();
    ranklist.contest.duration = [5, 'min'];
    ranklist.series = [{
      title: 'Overall',
      segments: [{ title: 'Gold', style: 'gold' }, { title: 'Silver', style: 'silver' }],
      rule: { preset: 'ICPC', options: { ratio: { value: [0.5, 0.5] } } },
    }];
    expect(serializedCurve(ranklist, [1, 'min'])).toMatchSnapshot();
  });

  it('supports an empty field and contests without ICPC series', () => {
    const ranklist = curveFixture();
    ranklist.rows = [];
    expect(getAllRankTimeData(ranklist, [], [1, 'min']).userRankTimePointsList.size).toBe(0);
    ranklist.series = [];
    expect(getAllRankTimeData(ranklist, [], [1, 'min'])).toMatchObject({
      unit: 'min', totalUsers: 0, seriesSegmentsList: [],
    });
  });
});
