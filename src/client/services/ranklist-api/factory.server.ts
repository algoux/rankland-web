import { getRanklandRuntimeConfig } from '@/app/config';
import { ApiService } from './api-service';
import { MemoryCacheManager } from './cache-manager';
import { createFetchRequestAdapter } from './request';

const cacheManager = new MemoryCacheManager();

export function createServerRanklandApi() {
  const config = getRanklandRuntimeConfig();
  return new ApiService({
    api: createFetchRequestAdapter({
      baseUrl: config.apiBaseServer,
      timeoutMs: 5_000,
    }),
    cdnApi: createFetchRequestAdapter({
      baseUrl: config.cdnApiBaseServer,
      timeoutMs: 5_000,
    }),
    cacheManager,
  });
}
