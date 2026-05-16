import type { RanklandApiService } from '@common/rankland-api';
import { inject, type App, type InjectionKey } from 'vue';

export const RANKLAND_API_SERVICE_TOKEN: InjectionKey<RanklandApiService> = Symbol('RanklandApiService');

export class RanklandApiPlugin {
  public static install(app: App, options: { ranklandApiService: RanklandApiService }) {
    app.provide(RANKLAND_API_SERVICE_TOKEN, options.ranklandApiService);
  }
}

export function useRanklandApiService(): RanklandApiService {
  const service = inject(RANKLAND_API_SERVICE_TOKEN);
  if (!service) {
    throw new Error('RanklandApiService is not provided');
  }
  return service;
}
