import { describe, expect, it } from 'vitest';
import type * as srk from '@algoux/standard-ranklist';
import { convertToStaticRanklist, getSortedCalculatedRawSolutions } from '@algoux/standard-ranklist-utils';
import ranklistFixture from '../../../tests/fixtures/ranklist.srk.json';
import { handleRankTimeWorkerMessage } from './rank-time-data.worker';
import type { RankTimeWorkerRequest } from './rank-time-worker.types';

describe('rank-time-data.worker', () => {
  it('selects from a prepared cache without resending ranklist data', () => {
    const ranklist = ranklistFixture as srk.Ranklist;
    const solutions = getSortedCalculatedRawSolutions(ranklist.rows);
    const staticData = convertToStaticRanklist(ranklist);
    const cacheKey = 'prepared-ranklist';

    const prepareResponse = handleRankTimeWorkerMessage({
      requestId: 1,
      kind: 'prepare',
      cacheKey,
      ranklist,
      solutions,
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
      staticRows: staticData.rows,
      staticSeries: staticData.series,
      staticMarkers: staticData.markers,
      userId: 'team-alpha',
      fixedMarker: '',
    } satisfies RankTimeWorkerRequest);

    expect(selectResponse.error).toBeUndefined();
    expect(selectResponse.data?.points.length).toBeGreaterThan(0);
    expect(selectResponse.data?.totalUsers).toBe(2);
  });
});
