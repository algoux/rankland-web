import { describe, expect, it, vi } from 'vitest';
import { RanklistService } from '../ranklist.service';

function createContestService(contests: unknown[]) {
  return {
    listContests: vi.fn(async (admin: boolean) => {
      expect(admin).toBe(false);
      return { contests };
    }),
  };
}

describe('RanklistService', () => {
  it('loads contests locally, filters contests without SRK files, maps the page model, and sorts deterministically', async () => {
    const contestService = createContestService([
      {
        _id: '9',
        uk: 'older',
        name: 'Older',
        srkFileID: 'file-older',
        viewCount: 5,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-02T00:00:00.000Z',
      },
      {
        _id: '2',
        uk: 'same-time-low-id',
        name: 'Same Time Low ID',
        srkFileID: 'file-low',
        viewCount: 3,
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-02T00:00:00.000Z',
      },
      {
        _id: '3',
        uk: 'not-static',
        name: 'Not Static',
        srkFileID: null,
        viewCount: 99,
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-02T00:00:00.000Z',
      },
      {
        _id: '10',
        uk: 'same-time-high-id',
        name: 'Same Time High ID',
        srkFileID: 'file-high',
        viewCount: 7,
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-03T00:00:00.000Z',
      },
    ]);
    const service = new RanklistService(contestService as any);

    await expect(service.getAllRanklists()).resolves.toEqual([
      {
        id: '10',
        uniqueKey: 'same-time-high-id',
        name: 'Same Time High ID',
        fileID: 'file-high',
        viewCnt: 7,
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-03T00:00:00.000Z',
      },
      {
        id: '2',
        uniqueKey: 'same-time-low-id',
        name: 'Same Time Low ID',
        fileID: 'file-low',
        viewCnt: 3,
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-02T00:00:00.000Z',
      },
      {
        id: '9',
        uniqueKey: 'older',
        name: 'Older',
        fileID: 'file-older',
        viewCnt: 5,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-02T00:00:00.000Z',
      },
    ]);

    expect(contestService.listContests).toHaveBeenCalledTimes(1);
  });

  it('does not keep a second cache outside ContestService', async () => {
    const contestService = createContestService([
      {
        _id: '1',
        uk: 'rank-a',
        name: 'Rank A',
        srkFileID: 'file-a',
        viewCount: 0,
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      },
    ]);
    const service = new RanklistService(contestService as any);

    await service.getAllRanklists();
    await service.getAllRanklists();

    expect(contestService.listContests).toHaveBeenCalledTimes(2);
  });
});
