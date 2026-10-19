import { describe, expect, it, vi } from 'vitest';
import type { ApiService } from '@/services/ranklist-api';
import type { LiveContestConfig } from '@/services/ranklist-api/live-contest-types';
import { loadLivePageData } from './page-data';

const contest: LiveContestConfig = {
  uk: 'live-key',
  name: 'Live Contest',
  contest: {
    title: 'Live Contest',
    duration: [5, 'h'],
  },
  problems: [],
  users: [],
  markers: [],
  series: [],
  sorter: {
    algorithm: 'ICPC',
    config: {},
  },
  contributors: [],
};

function createApi(overrides: Partial<ApiService> = {}) {
  const transport = {
    getContest: vi.fn(async () => contest),
  };
  return {
    createLiveContestTransport: vi.fn(() => transport),
    ...overrides,
  } as unknown as ApiService;
}

describe('live page data helpers', () => {
  it('loads only the API v2 live contest metadata', async () => {
    const api = createApi();

    await expect(loadLivePageData({ api, id: 'live-key' })).resolves.toEqual({
      requestedUk: 'live-key',
      config: contest,
    });
    const transport = api.createLiveContestTransport(vi.fn());
    expect(transport.getContest).toHaveBeenCalledWith('live-key');
  });
});
