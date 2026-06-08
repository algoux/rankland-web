import type * as srk from '@algoux/standard-ranklist';
import { describe, expect, it, vi } from 'vitest';
import type { ApiService, IApiLiveRanklistInfo } from '@/services/ranklist-api';
import { loadLivePageData } from './page-data';

const liveInfo = {
  id: 'live-id',
  uniqueKey: 'live-key',
  title: 'Live Contest',
  members: [],
  problems: [],
  markers: [],
  series: [],
  contributors: [],
  type: 'ICPC',
} as unknown as IApiLiveRanklistInfo;

const ranklist = {
  contest: { title: 'Live Contest', duration: [5, 'h'] },
  rows: [],
} as unknown as srk.Ranklist;

function createApi(overrides: Partial<ApiService> = {}) {
  return {
    getLiveRanklistInfo: vi.fn(async () => liveInfo),
    getLiveRanklist: vi.fn(async () => ranklist),
    ...overrides,
  } as unknown as ApiService;
}

describe('live page data helpers', () => {
  it('loads live contest info and the first ranklist snapshot', async () => {
    const api = createApi();

    await expect(loadLivePageData({ api, id: 'live-key', token: 'secret' })).resolves.toEqual({
      liveInfo,
      ranklist,
    });
    expect(api.getLiveRanklistInfo).toHaveBeenCalledWith({ uniqueKey: 'live-key' });
    expect(api.getLiveRanklist).toHaveBeenCalledWith({ id: 'live-id', token: 'secret' });
  });

  it('omits the token when the live page URL has none', async () => {
    const api = createApi();

    await loadLivePageData({ api, id: 'live-key' });

    expect(api.getLiveRanklist).toHaveBeenCalledWith({ id: 'live-id', token: undefined });
  });
});
