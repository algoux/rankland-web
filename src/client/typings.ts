import type { HookParams } from 'vite-ssr/vue/types';
import type { RouteLocationNormalized } from 'vue-router';
import type { ApiClientType } from './api';
import type { ApiService } from './services/ranklist-api';

export interface AsyncDataOptions {
  app: HookParams['app'];
  router: HookParams['router'];
  initialState: HookParams['initialState'];
  isClient: HookParams['isClient'];
  writeResponse: HookParams['writeResponse'];
  to: RouteLocationNormalized;
  from: RouteLocationNormalized;
  api: ApiService;
  apiClient: ApiClientType;
}
