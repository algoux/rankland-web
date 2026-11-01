import { describe, expect, it } from 'vitest';
import type * as srk from '@algoux/standard-ranklist';
import { convertToStaticRanklist, getSortedCalculatedRawSolutions } from '@algoux/standard-ranklist-utils';
import ranklistFixture from '../../../tests/fixtures/ranklist.srk.json';
import { handleRankTimeWorkerMessage } from './rank-time-data.worker';
import type { RankTimeWorkerRequest } from './rank-time-worker.types';
import { getAllRankTimeData, selectUserMainRankTimeData } from './rank-time-data.util';

describe('rank-time-data.worker', () => {
  it('selects from a prepared cache without resending ranklist data', () => {
    const ranklist = ranklistFixture as srk.Ranklist;
    const staticData = convertToStaticRanklist(ranklist);
    const cacheKey = 'prepared-ranklist';

    const prepareResponse = handleRankTimeWorkerMessage({
      requestId: 1,
      kind: 'prepare',
      cacheKey,
      ranklist,
      unit: [1, 'min'],
    } satisfies RankTimeWorkerRequest);

    expect(prepareResponse).toMatchObject({
      requestId: 1,
      kind: 'prepare',
    });
    expect(prepareResponse.error).toBeUndefined();

    const selectResponse = handleRankTimeWorkerMessage({
      requestId: 2,
      kind: 'select',
      cacheKey,
      user: staticData.rows[0].user,
      staticSeries: staticData.series,
      staticMarkers: staticData.markers,
      userId: 'team-alpha',
      fixedMarker: '',
    } satisfies RankTimeWorkerRequest);

    expect(selectResponse.error).toBeUndefined();
    expect(selectResponse.data?.points.length).toBeGreaterThan(0);
    expect(selectResponse.data?.totalUsers).toBe(2);
  });

  it('selects different users with compact metadata and never reuses a different contest cache', () => {
    const ranklist = ranklistFixture as srk.Ranklist;
    const staticData = convertToStaticRanklist(ranklist);
    const all = getAllRankTimeData(ranklist, getSortedCalculatedRawSolutions(ranklist.rows), [1, 'min']);
    for (const [index, row] of staticData.rows.entries()) {
      const response = handleRankTimeWorkerMessage({
        requestId: index + 10,
        kind: 'select', cacheKey: 'compact-selection',
        ...(index === 0 ? { ranklist, unit: [1, 'min'] as srk.TimeDuration } : {}),
        user: row.user, userId: row.user.id,
        staticSeries: staticData.series, staticMarkers: staticData.markers,
      });
      expect(response.error).toBeUndefined();
      expect(response.data).toEqual(selectUserMainRankTimeData({
        rankTimeDataSet: all, staticRows: staticData.rows,
        staticSeries: staticData.series, staticMarkers: staticData.markers, userId: row.user.id,
      }));
    }
    expect(handleRankTimeWorkerMessage({
      requestId: 99, kind: 'select', cacheKey: 'unprepared-other-contest',
      user: staticData.rows[0].user, userId: staticData.rows[0].user.id, staticSeries: staticData.series,
    }).error).toBe('Rank time worker cache is not prepared');
  });
});
