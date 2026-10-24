import { describe, expect, it, vi } from 'vitest';
import { ApiService } from './api-service';
import type { RanklandRequestAdapter } from './types';

type GetMock = ReturnType<typeof vi.fn>;

function makeAdapter(getMock: GetMock): RanklandRequestAdapter {
  return { get: getMock } as unknown as RanklandRequestAdapter;
}

function buildService(apiGet: GetMock = vi.fn()) {
  const service = new ApiService({
    legacyApi: makeAdapter(apiGet),
    apiClient: {
      getPublicContest: vi.fn(),
      getPublicFile: vi.fn(),
      getPublicContests: vi.fn(),
      getPublicCollection: vi.fn(),
      getPublicStatistics: vi.fn(),
    } as any,
  });
  return { service, apiGet };
}

describe('ApiService legacy Rankland API boundary', () => {
  it('keeps ranklist search on the legacy request adapter', async () => {
    const apiGet = vi.fn().mockResolvedValue({ ranks: [] });
    const { service } = buildService(apiGet);

    await service.searchRanklist({ kw: 'hello' });

    expect(apiGet.mock.calls[0][0]).toBe('/rank/search?query=hello');
  });
});
