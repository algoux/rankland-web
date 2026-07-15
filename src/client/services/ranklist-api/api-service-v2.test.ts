import { describe, expect, it, vi } from 'vitest';
import { ApiRequestException } from '@client/api';
import { ErrCode } from '@common/enums/err-code.enum';
import { ApiService } from './api-service';
import { LogicExceptionKind } from './logic-exception';
import type { CacheManager, RanklandRequestAdapter } from './types';

function makeCache(): CacheManager {
  const values = new Map<string, string>();
  return {
    get: vi.fn(async (key) => values.get(key)),
    set: vi.fn(async (key, value) => {
      values.set(key, value);
    }),
    setEx: vi.fn(async (key, _seconds, value) => {
      values.set(key, value);
    }),
    del: vi.fn(async (key) => {
      values.delete(key);
    }),
  };
}

function makeLegacyAdapter(get = vi.fn()): RanklandRequestAdapter {
  return { get } as unknown as RanklandRequestAdapter;
}

function makeContest(overrides: Record<string, unknown> = {}) {
  return {
    _id: '100',
    uk: 'contest-a',
    name: 'Contest A',
    title: { fallback: 'Contest A' },
    startAt: '2026-01-01T00:00:00Z',
    duration: [5, 'h'],
    frozenDuration: null,
    banner: null,
    refLinks: null,
    problems: null,
    users: [],
    markers: null,
    series: null,
    sorter: null,
    srkFileID: '200',
    viewCount: 7,
    redirectUK: null,
    ...overrides,
  };
}

function buildService(overrides: Record<string, unknown> = {}) {
  const apiClient = {
    getPublicContest: vi.fn().mockResolvedValue(makeContest()),
    getPublicFile: vi.fn().mockResolvedValue({ id: '200', url: '/file/200/contest-a.srk.json' }),
    getPublicContests: vi.fn().mockResolvedValue({ contests: [] }),
    getPublicCollection: vi.fn().mockResolvedValue({ content: { root: { children: [] } } }),
    getPublicStatistics: vi.fn().mockResolvedValue({ totalSrkCount: 3, totalViewCount: 21 }),
  };
  const fetchFile = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    type: 'general',
    version: '0.3.12',
    rows: [],
  }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  }));
  const service = new ApiService({
    legacyApi: makeLegacyAdapter(),
    apiClient,
    fetchFile,
    resolveFileUrl: (url: string) => new URL(url, 'http://127.0.0.1:4321').toString(),
    cacheManager: makeCache(),
    ...overrides,
  } as any);
  return { service, apiClient, fetchFile };
}

describe('ApiService v2 ranklist API', () => {
  it('loads a static ranklist through contest and file metadata and reuses cached JSON', async () => {
    const { service, apiClient, fetchFile } = buildService();

    const first = await service.getRanklist({ uniqueKey: 'contest-a' });
    const second = await service.getRanklist({ uniqueKey: 'contest-a' });

    expect(first).toMatchObject({
      info: {
        id: '100',
        uniqueKey: 'contest-a',
        name: 'Contest A',
        fileID: '200',
        viewCnt: 7,
      },
      srkUrl: '/file/200/contest-a.srk.json',
      srk: { type: 'general', version: '0.3.12', rows: [] },
    });
    expect(second).toEqual(first);
    expect(apiClient.getPublicContest).toHaveBeenCalledTimes(1);
    expect(apiClient.getPublicContest).toHaveBeenCalledWith({ uk: 'contest-a' });
    expect(apiClient.getPublicFile).toHaveBeenCalledTimes(2);
    expect(apiClient.getPublicFile).toHaveBeenCalledWith({ id: '200' });
    expect(fetchFile).toHaveBeenCalledTimes(1);
    expect(fetchFile).toHaveBeenCalledWith('http://127.0.0.1:4321/file/200/contest-a.srk.json');
  });

  it('uses typed list, collection, and statistics APIs and filters live-only contests', async () => {
    const { service, apiClient } = buildService();
    apiClient.getPublicContests.mockResolvedValue({
      contests: [
        makeContest({ _id: '101', uk: 'newer-id', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }),
        makeContest({ _id: '102', uk: 'live-only', srkFileID: null, createdAt: '2027-01-01T00:00:00Z', updatedAt: '2027-01-01T00:00:00Z' }),
        makeContest({ _id: '99', uk: 'newer-date', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' }),
        makeContest({ _id: '100', uk: 'same-date-higher-id', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' }),
      ],
    });
    apiClient.getPublicCollection.mockResolvedValue({
      content: { root: { children: [{ type: 1, uniqueKey: 'contest-a', name: 'Contest A' }] } },
    });

    await expect(service.listAllRanklists()).resolves.toMatchObject({
      ranks: [
        { uniqueKey: 'same-date-higher-id' },
        { uniqueKey: 'newer-date' },
        { uniqueKey: 'newer-id' },
      ],
    });
    await expect(service.getCollection({ uniqueKey: 'official' })).resolves.toEqual({
      root: { children: [{ type: 1, uniqueKey: 'contest-a', name: 'Contest A' }] },
    });
    await expect(service.getCollection({ uniqueKey: 'official' })).resolves.toEqual({
      root: { children: [{ type: 1, uniqueKey: 'contest-a', name: 'Contest A' }] },
    });
    await expect(service.getStatistics()).resolves.toEqual({ totalSrkCount: 3, totalViewCount: 21 });
    expect(apiClient.getPublicCollection).toHaveBeenCalledWith({ uk: 'official' });
    expect(apiClient.getPublicCollection).toHaveBeenCalledTimes(1);
    expect(apiClient.getPublicStatistics).toHaveBeenCalledWith();
  });

  it('preserves absolute storage URLs and maps a raw file 404 to NotFound', async () => {
    const absolute = buildService();
    absolute.apiClient.getPublicFile.mockResolvedValue({
      id: '200',
      url: 'https://cdn.example.test/rankland/contest-a.srk.json',
    });

    await absolute.service.getRanklist({ uniqueKey: 'contest-a' });
    expect(absolute.fetchFile).toHaveBeenCalledWith('https://cdn.example.test/rankland/contest-a.srk.json');

    const missingRawFile = buildService({
      fetchFile: vi.fn().mockResolvedValue(new Response('missing', { status: 404, statusText: 'Not Found' })),
    });
    await expect(missingRawFile.service.getRanklist({ uniqueKey: 'contest-a' })).rejects.toMatchObject({
      kind: LogicExceptionKind.NotFound,
    });
  });

  it('maps missing contests, files, collections, and null SRK associations to page NotFound', async () => {
    const contestMissing = buildService();
    contestMissing.apiClient.getPublicContest.mockRejectedValue(
      new ApiRequestException(ErrCode.ContestNotFound, 'not found'),
    );
    const fileMissing = buildService();
    fileMissing.apiClient.getPublicFile.mockRejectedValue(
      new ApiRequestException(ErrCode.FileNotFound, 'not found'),
    );
    const collectionMissing = buildService();
    collectionMissing.apiClient.getPublicCollection.mockRejectedValue(
      new ApiRequestException(ErrCode.CollectionNotFound, 'not found'),
    );
    const liveOnly = buildService();
    liveOnly.apiClient.getPublicContest.mockResolvedValue(makeContest({ srkFileID: null }));

    for (const promise of [
      contestMissing.service.getRanklist({ uniqueKey: 'missing' }),
      fileMissing.service.getRanklist({ uniqueKey: 'missing-file' }),
      liveOnly.service.getRanklist({ uniqueKey: 'live-only' }),
      collectionMissing.service.getCollection({ uniqueKey: 'missing-collection' }),
    ]) {
      await expect(promise).rejects.toMatchObject({ kind: LogicExceptionKind.NotFound });
    }
  });
});
