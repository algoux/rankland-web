import { getRanklandRuntimeConfig } from '@/app/config';
import type { ApiClientType } from '@/api';
import { ApiService } from './api-service';
import { createFetchRequestAdapter, createFetchResponseLoader } from './request';

export function createClientRanklandApi(apiClient: ApiClientType) {
  const config = getRanklandRuntimeConfig();
  return new ApiService({
    legacyApi: createFetchRequestAdapter({
      baseUrl: config.legacyApiBaseClient,
      timeoutMs: 30_000,
    }),
    apiClient,
    fetchFile: createFetchResponseLoader({ timeoutMs: 30_000 }),
  });
}
