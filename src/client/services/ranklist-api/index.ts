import { inject } from 'vue';
import type { InjectionKey } from 'vue';
import type { ApiService } from './api-service';

export { ApiService } from './api-service';
export { MemoryCacheManager } from './cache-manager';
export { ApiException, HttpException, createFetchRequestAdapter } from './request';
export { LogicException, LogicExceptionKind } from './logic-exception';
export { CollectionItemType } from './types';
export type * from './types';

export const RANKLAND_API_TOKEN: InjectionKey<ApiService> = Symbol('RanklandApi');

export function useRanklandApi() {
  return inject(RANKLAND_API_TOKEN);
}
