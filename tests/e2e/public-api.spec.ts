import { expect, test } from './test';

test.describe('public v2 API', () => {
  test('statistics match active public contests with SRK files', async ({ request }) => {
    const [contestsResponse, statisticsResponse] = await Promise.all([
      request.get('/api/v2/public/contests'),
      request.get('/api/v2/public/statistics'),
    ]);

    expect(contestsResponse.ok()).toBe(true);
    expect(statisticsResponse.ok()).toBe(true);

    const contestsPayload = await contestsResponse.json();
    const statisticsPayload = await statisticsResponse.json();
    const staticContests = contestsPayload.data.contests.filter(
      (contest: { srkFileID: string | null }) => contest.srkFileID,
    );

    expect(contestsPayload.data.contests).toEqual(
      expect.arrayContaining([expect.objectContaining({ uk: 'e2e-live-only', srkFileID: null, viewCount: 500 })]),
    );
    expect(contestsPayload.data.contests).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ uk: 'e2e-soft-deleted' })]),
    );
    expect(statisticsPayload.data).toEqual({
      totalSrkCount: staticContests.length,
      totalViewCount: staticContests.reduce(
        (total: number, contest: { viewCount: number }) => total + contest.viewCount,
        0,
      ),
    });
  });
});
