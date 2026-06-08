import type * as srk from '@algoux/standard-ranklist';
import urlcatImport from 'urlcat-fork';
import { ApiException, HttpException } from './request';
import { LogicException, LogicExceptionKind } from './logic-exception';
import type {
  CacheManager,
  IApiCollection,
  IApiLiveRanklistInfo,
  IApiRanklist,
  IApiRanklistInfo,
  IApiStatistics,
  RanklandRequestAdapter,
} from './types';

const urlcat = ((urlcatImport as any).default || urlcatImport) as typeof urlcatImport;

interface ApiServiceOptions {
  api: RanklandRequestAdapter;
  cdnApi: RanklandRequestAdapter;
  cacheManager?: CacheManager;
}

export class ApiService {
  private readonly api: RanklandRequestAdapter;
  private readonly cdnApi: RanklandRequestAdapter;
  private readonly cacheManager?: CacheManager;

  public constructor(options: ApiServiceOptions) {
    this.api = options.api;
    this.cdnApi = options.cdnApi;
    this.cacheManager = options.cacheManager;
  }

  public async getRanklistInfo(opts: { uniqueKey: string }) {
    const cacheKey = `rankland_ssr_api_cache:getRanklistInfo:${opts.uniqueKey}`;
    const cached = await this.cacheManager?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as IApiRanklistInfo;
    }
    const res = await this.cdnApi.get<IApiRanklistInfo>(urlcat('/rank/:key', { key: opts.uniqueKey }));
    await this.cacheManager?.setEx(cacheKey, 60, JSON.stringify(res));
    return res;
  }

  public async getSrkFile<T = srk.Ranklist>(opts: { fileID: string }): Promise<T> {
    const cacheKey = `rankland_ssr_api_cache:getSrkFile:${opts.fileID}`;
    const cached = await this.cacheManager?.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as T;
      } catch (e) {
        console.error('JSON.parse the ssr api cache string failed, the cache may be broken:', cacheKey, cached);
        await this.cacheManager?.del(cacheKey);
      }
    }

    const apiRes = await this.cdnApi.get(urlcat('/file/download', { id: opts.fileID }), {
      getResponse: true,
    });
    switch ((apiRes.response.headers.get('content-type') || '').split(';')[0]) {
      case 'application/json': {
        const plain = await apiRes.response.text();
        await this.cacheManager?.setEx(cacheKey, 24 * 60 * 60, plain);
        return JSON.parse(plain) as T;
      }
      default:
        throw new Error('Unknown srk content type');
    }
  }

  public async getRanklist(opts: { uniqueKey: string }): Promise<IApiRanklist> {
    try {
      const info = await this.getRanklistInfo({ uniqueKey: opts.uniqueKey });
      const ranklist = await this.getSrkFile({ fileID: info.fileID });
      return {
        info,
        srk: ranklist,
      };
    } catch (e) {
      if ((e instanceof ApiException && e.code === 11) || (e instanceof HttpException && e.status === 404)) {
        throw new LogicException(LogicExceptionKind.NotFound);
      }
      throw e;
    }
  }

  public async searchRanklist(opts: { kw?: string }) {
    return this.api.get<{ ranks: IApiRanklistInfo[] }>(urlcat('/rank/search', { query: opts.kw }));
  }

  public async listAllRanklists() {
    return this.api.get<{ ranks: IApiRanklistInfo[] }>('/rank/listall');
  }

  public async getCollection(opts: { uniqueKey: string }) {
    try {
      const cacheKey = `rankland_ssr_api_cache:getCollection:${opts.uniqueKey}`;
      const cached = await this.cacheManager?.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as IApiCollection;
      }
      const plain = await this.cdnApi
        .get<{ content: string }>(urlcat('/rank/group/:key', { key: opts.uniqueKey }))
        .then((res) => res.content);
      await this.cacheManager?.setEx(cacheKey, 2 * 60, plain);
      return JSON.parse(plain) as IApiCollection;
    } catch (e) {
      if ((e instanceof ApiException && e.code === 11) || (e instanceof HttpException && e.status === 404)) {
        throw new LogicException(LogicExceptionKind.NotFound);
      }
      throw e;
    }
  }

  public getStatistics() {
    return this.api.get<IApiStatistics>('/statistics');
  }

  public getLiveRanklistInfo(opts: { uniqueKey: string }): Promise<IApiLiveRanklistInfo> {
    return this.api
      .get<IApiLiveRanklistInfo>(
        urlcat('/ranking/config/:uniqueKey', { uniqueKey: opts.uniqueKey, _t: Date.now() }),
      )
      .catch((e) => {
        if ((e instanceof ApiException && e.code === 11) || (e instanceof HttpException && e.status === 404)) {
          throw new LogicException(LogicExceptionKind.NotFound);
        }
        throw e;
      });
  }

  public getLiveRanklist(opts: { id: string; token?: string }): Promise<srk.Ranklist> {
    return this.api.get<srk.Ranklist>(
      urlcat('/ranking/:id', { id: opts.id, token: opts.token || undefined, _t: Date.now() }),
    );
  }
}
