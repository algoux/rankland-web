import { getRanklandRuntimeConfig } from '@/app/config';
import { getServerLoopbackOrigin } from '@/api/api-factory.server';
import type { ApiClientType } from '@/api';
import { ApiService } from './api-service';
import { MemoryCacheManager } from './cache-manager';
import { createFetchRequestAdapter, createFetchResponseLoader } from './request';

const cacheManager = new MemoryCacheManager();

export function createServerRanklandApi(apiClient: ApiClientType) {
  const config = getRanklandRuntimeConfig();
  const loopbackOrigin = getServerLoopbackOrigin();
  return new ApiService({
    legacyApi: createFetchRequestAdapter({
      baseUrl: config.legacyApiBaseServer,
      timeoutMs: 5_000,
    }),
    apiClient,
    fetchFile: createFetchResponseLoader({ timeoutMs: 5_000 }),
    resolveFileUrl: (url) => new URL(url, loopbackOrigin).toString(),
    cacheManager,
  });
}
