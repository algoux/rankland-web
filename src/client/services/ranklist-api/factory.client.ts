import { getRanklandRuntimeConfig } from '@/app/config';
import { ApiService } from './api-service';
import { createFetchRequestAdapter } from './request';

export function createClientRanklandApi() {
  const config = getRanklandRuntimeConfig();
  return new ApiService({
    api: createFetchRequestAdapter({
      baseUrl: config.apiBaseClient,
      timeoutMs: 30_000,
    }),
    cdnApi: createFetchRequestAdapter({
      baseUrl: config.cdnApiBaseClient,
      timeoutMs: 30_000,
    }),
  });
}
