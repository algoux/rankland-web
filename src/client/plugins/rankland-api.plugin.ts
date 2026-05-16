import type { RanklandApiService } from '@common/rankland-api';
import { inject, type App } from 'vue';

export const RANKLAND_API_SERVICE_TOKEN = Symbol('RanklandApiService');

export class RanklandApiPlugin {
  public static install(app: App, options: { ranklandApiService: RanklandApiService }) {
    app.provide(RANKLAND_API_SERVICE_TOKEN, options.ranklandApiService);
  }
}

export function useRanklandApiService(): RanklandApiService {
  const service = inject<RanklandApiService>(RANKLAND_API_SERVICE_TOKEN);
  if (!service) {
    throw new Error('RanklandApiService is not provided');
  }
  return service;
}
