import '@vue/runtime-core';
import type { AsyncDataOptions } from './typings';
import type { ApiClientType } from './api';
import type { ThemeService } from './lib/theme';
import type { ApiService } from './services/ranklist-api';

declare module '@vue/runtime-core' {
  export interface ComponentCustomOptions {
    asyncData?: (opts: AsyncDataOptions) => any | Promise<any>;
  }

  export interface ComponentCustomProperties {
    $api: ApiClientType;
    $ranklandApi: ApiService;
    $theme: ThemeService;
  }
}
