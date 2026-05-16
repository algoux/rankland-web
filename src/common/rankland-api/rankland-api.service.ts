import type * as srk from '@algoux/standard-ranklist';
import { configure as configureUrlcat } from 'urlcat-fork';
import {
  RanklandApiException,
  RanklandHttpException,
  RanklandLogicException,
  RanklandLogicExceptionKind,
} from './exceptions';
import type {
  IApiCollection,
  IApiLiveRanklistInfo,
  IApiRanklist,
  IApiRanklistInfo,
  IApiStatistics,
} from './interfaces';
import type { RanklandApiCache, RanklandApiRequestAdapter } from './request-adapter';

const urlcat = configureUrlcat({ arrayFormat: 'repeat' });
const CACHE_KEY_PREFIX = 'rankland_ssr_api_cache';
const RANKLIST_INFO_TTL_SECONDS = 60;
const SRK_FILE_TTL_SECONDS = 24 * 60 * 60;
const COLLECTION_TTL_SECONDS = 2 * 60;

interface RanklandApiServiceAdapters {
  api: RanklandApiRequestAdapter;
  cdnApi: RanklandApiRequestAdapter;
  cache?: RanklandApiCache;
}

interface RawResponseLike {
  headers: {
    get(name: string): string | null;
  };
  text(): Promise<string>;
}

export class RanklandApiService {
  private readonly api: RanklandApiRequestAdapter;
  private readonly cdnApi: RanklandApiRequestAdapter;
  private readonly cache?: RanklandApiCache;

  public constructor(adapters: RanklandApiServiceAdapters) {
    this.api = adapters.api;
    this.cdnApi = adapters.cdnApi;
    this.cache = adapters.cache;
  }

  public async getRanklistInfo(opts: { uniqueKey: string }): Promise<IApiRanklistInfo> {
    const cacheKey = `${CACHE_KEY_PREFIX}:getRanklistInfo:${opts.uniqueKey}`;
    const cached = await this.cache?.get(cacheKey);
    if (typeof cached === 'string') {
      return JSON.parse(cached) as IApiRanklistInfo;
    }

    const info = await this.cdnApi.get<IApiRanklistInfo>(urlcat('/rank/:key', { key: opts.uniqueKey }));
    await this.cache?.setEx(cacheKey, RANKLIST_INFO_TTL_SECONDS, JSON.stringify(info));
    return info;
  }

  public async getSrkFile<T = srk.Ranklist>(opts: { fileID: string }): Promise<T> {
    const cacheKey = `${CACHE_KEY_PREFIX}:getSrkFile:${opts.fileID}`;
    const cached = await this.cache?.get(cacheKey);
    if (typeof cached === 'string') {
      try {
        return JSON.parse(cached) as T;
      } catch (error) {
        await this.cache?.del(cacheKey);
      }
    }

    const apiRes = await this.cdnApi.get<{ response: RawResponseLike }>(urlcat('/file/download', { id: opts.fileID }), {
      getResponse: true,
    });
    const contentType = (apiRes.response.headers.get('content-type') || '').split(';')[0];

    if (contentType !== 'application/json') {
      throw new Error('Unknown srk content type');
    }

    const rawSrk = await apiRes.response.text();
    const parsedSrk = JSON.parse(rawSrk) as T;
    await this.cache?.setEx(cacheKey, SRK_FILE_TTL_SECONDS, rawSrk);
    return parsedSrk;
  }

  public async getRanklist(opts: { uniqueKey: string }): Promise<IApiRanklist> {
    try {
      const info = await this.getRanklistInfo({ uniqueKey: opts.uniqueKey });
      const ranklist = await this.getSrkFile({ fileID: info.fileID });
      return { info, srk: ranklist };
    } catch (error) {
      if (
        (error instanceof RanklandApiException && error.code === 11) ||
        (error instanceof RanklandHttpException && error.status === 404)
      ) {
        throw new RanklandLogicException(RanklandLogicExceptionKind.NotFound);
      }
      throw error;
    }
  }

  public async searchRanklist(opts: { kw?: string }): Promise<{ ranks: IApiRanklistInfo[] }> {
    return this.api.get<{ ranks: IApiRanklistInfo[] }>(urlcat('/rank/search', { query: opts.kw }));
  }

  public async listAllRanklists(): Promise<{ ranks: IApiRanklistInfo[] }> {
    return this.api.get<{ ranks: IApiRanklistInfo[] }>('/rank/listall');
  }

  public async getCollection(opts: { uniqueKey: string }): Promise<IApiCollection> {
    const cacheKey = `${CACHE_KEY_PREFIX}:getCollection:${opts.uniqueKey}`;
    const cached = await this.cache?.get(cacheKey);
    if (typeof cached === 'string') {
      return JSON.parse(cached) as IApiCollection;
    }

    const res = await this.cdnApi.get<{ content: string }>(urlcat('/rank/group/:key', { key: opts.uniqueKey }));
    await this.cache?.setEx(cacheKey, COLLECTION_TTL_SECONDS, res.content);
    return JSON.parse(res.content) as IApiCollection;
  }

  public getStatistics(): Promise<IApiStatistics> {
    return this.api.get<IApiStatistics>('/statistics');
  }

  public async getLiveRanklistInfo(opts: { uniqueKey: string }): Promise<IApiLiveRanklistInfo> {
    return this.api.get<IApiLiveRanklistInfo>(
      urlcat('/ranking/config/:uniqueKey', { uniqueKey: opts.uniqueKey, _t: Date.now() }),
    );
  }

  public async getLiveRanklist(opts: { id: string; token?: string }): Promise<srk.Ranklist> {
    return this.api.get<srk.Ranklist>(
      urlcat('/ranking/:id', { id: opts.id, token: opts.token || undefined, _t: Date.now() }),
    );
  }
}
