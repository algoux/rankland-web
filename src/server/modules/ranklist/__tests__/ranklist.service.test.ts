import { describe, expect, it, vi } from 'vitest';
import HttpException from '@server/exceptions/http.exception';
import {
  RANKLIST_CACHE_KEY,
  RANKLIST_CACHE_TTL_SECONDS,
  RanklistService,
} from '../ranklist.service';

function createRedis(initial?: string) {
  let value = initial;
  return {
    status: 'ready',
    get: vi.fn(async (_key: string) => value ?? null),
    setex: vi.fn(async (_key: string, _seconds: number, nextValue: string) => {
      value = nextValue;
      return 'OK';
    }),
    del: vi.fn(async (_key: string) => 1),
  };
}

function createFetch(ranks: unknown[]) {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({
      code: 0,
      data: { ranks },
    }),
  }));
}

describe('RanklistService', () => {
  it('fetches /rank/listall, validates ranklist info, preserves API order, and caches the full list', async () => {
    const redis = createRedis();
    const fetchMock = createFetch([
      {
        id: '1',
        uniqueKey: 'newest-rank',
        name: 'Newest Rank',
        fileID: 'f1',
        viewCnt: 10,
        content: '{}',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-02T00:00:00.000Z',
      },
      {
        id: '2',
        uniqueKey: 'middle-rank',
        name: 'Middle Rank',
        fileID: 'f2',
        viewCnt: 5,
        content: '{}',
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-02T00:00:00.000Z',
      },
      { uniqueKey: '', name: 'ignored' },
      { uniqueKey: 'missing-file-id', name: 'Ignored Missing File' },
    ]);
    const service = new RanklistService(redis as any);

    await expect(service.getAllRanklists({ fetchImpl: fetchMock as any })).resolves.toEqual([
      expect.objectContaining({ uniqueKey: 'newest-rank', name: 'Newest Rank', fileID: 'f1' }),
      expect.objectContaining({ uniqueKey: 'middle-rank', name: 'Middle Rank', fileID: 'f2' }),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://rl-api.algoux.cn/rank/listall');
    expect(redis.setex.mock.calls[0][0]).toBe(RANKLIST_CACHE_KEY);
    expect(redis.setex.mock.calls[0][1]).toBe(RANKLIST_CACHE_TTL_SECONDS);
    expect(JSON.parse(redis.setex.mock.calls[0][2])).toEqual([
      expect.objectContaining({ uniqueKey: 'newest-rank' }),
      expect.objectContaining({ uniqueKey: 'middle-rank' }),
    ]);
  });

  it('uses the cached full ranklist list without calling the external API', async () => {
    const cachedRanks = [
      {
        id: '1',
        uniqueKey: 'cached-rank',
        name: 'Cached Rank',
        fileID: 'f1',
        viewCnt: 1,
        content: '{}',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-02T00:00:00.000Z',
      },
    ];
    const redis = createRedis(JSON.stringify(cachedRanks));
    const fetchMock = createFetch([]);
    const service = new RanklistService(redis as any);

    await expect(service.getAllRanklists({ fetchImpl: fetchMock as any })).resolves.toEqual(cachedRanks);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('treats Redis failures as miss/write-skip and still returns API data', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const redis = {
      status: 'ready',
      get: vi.fn(async () => {
        throw new Error('redis get failed');
      }),
      setex: vi.fn(async () => {
        throw new Error('redis set failed');
      }),
      del: vi.fn(async () => 0),
    };
    const fetchMock = createFetch([
      {
        id: '1',
        uniqueKey: 'from-api',
        name: 'From API',
        fileID: 'f1',
        viewCnt: 1,
        content: '{}',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-02T00:00:00.000Z',
      },
    ]);
    const service = new RanklistService(redis as any);

    try {
      await expect(service.getAllRanklists({ fetchImpl: fetchMock as any })).resolves.toEqual([
        expect.objectContaining({ uniqueKey: 'from-api' }),
      ]);
    } finally {
      warn.mockRestore();
    }
  });

  it('deletes invalid cache JSON and refreshes from the external API', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const redis = createRedis('not-json');
    const fetchMock = createFetch([
      {
        id: '1',
        uniqueKey: 'fresh-rank',
        name: 'Fresh Rank',
        fileID: 'f1',
        viewCnt: 1,
        content: '{}',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-02T00:00:00.000Z',
      },
    ]);
    const service = new RanklistService(redis as any);

    try {
      await expect(service.getAllRanklists({ fetchImpl: fetchMock as any })).resolves.toEqual([
        expect.objectContaining({ uniqueKey: 'fresh-rank' }),
      ]);
      expect(redis.del).toHaveBeenCalledWith(RANKLIST_CACHE_KEY);
    } finally {
      warn.mockRestore();
    }
  });

  it('throws HTTP 502 when the external API cannot provide valid data on cache miss', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: async () => ({}),
    }));
    const service = new RanklistService(createRedis() as any);

    try {
      await expect(service.getAllRanklists({ fetchImpl: fetchMock as any })).rejects.toMatchObject<HttpException>({
        code: 502,
      });
    } finally {
      warn.mockRestore();
    }
  });
});
