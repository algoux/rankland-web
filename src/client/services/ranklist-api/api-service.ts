import type * as srk from '@algoux/standard-ranklist';
import urlcatImport from 'urlcat-fork';
import type { ContestSummaryDTO, GetPublicContestRespDTO } from '@common/modules/contest/contest.dto';
import { ErrCode } from '@common/enums/err-code.enum';
import { ApiRequestException, type ApiClientType } from '@client/api';
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
const LEGACY_API_NOT_FOUND_CODE = 11;

interface ApiServiceOptions {
  legacyApi: RanklandRequestAdapter;
  apiClient: Pick<
    ApiClientType,
    'getPublicContest' | 'getPublicFile' | 'getPublicContests' | 'getPublicCollection' | 'getPublicStatistics'
  >;
  fetchFile?: (url: string) => Promise<Response>;
  resolveFileUrl?: (url: string) => string;
  cacheManager?: CacheManager;
}

export class ApiService {
  private readonly legacyApi: RanklandRequestAdapter;
  private readonly apiClient: ApiServiceOptions['apiClient'];
  private readonly fetchFile: (url: string) => Promise<Response>;
  private readonly resolveFileUrl: (url: string) => string;
  private readonly cacheManager?: CacheManager;

  public constructor(options: ApiServiceOptions) {
    this.legacyApi = options.legacyApi;
    this.apiClient = options.apiClient;
    this.fetchFile = options.fetchFile ?? fetch;
    this.resolveFileUrl = options.resolveFileUrl ?? ((url) => url);
    this.cacheManager = options.cacheManager;
  }

  public async getRanklistInfo(opts: { uniqueKey: string }): Promise<IApiRanklistInfo> {
    const cacheKey = `rankland_ssr_api_cache:getRanklistInfo:${opts.uniqueKey}`;
    const cached = await this.cacheManager?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as IApiRanklistInfo;
    }
    const contest = await this.apiClient.getPublicContest({ uk: opts.uniqueKey });
    if (!contest.srkFileID) {
      throw new LogicException(LogicExceptionKind.NotFound);
    }
    const info = mapContestToRanklistInfo(contest, contest.srkFileID);
    await this.cacheManager?.setEx(cacheKey, 60, JSON.stringify(info));
    return info;
  }

  public async getSrkFile<T = srk.Ranklist>(opts: { fileID: string }): Promise<{ srk: T; srkUrl: string }> {
    const file = await this.apiClient.getPublicFile({ id: opts.fileID });
    const cacheKey = `rankland_ssr_api_cache:getSrkFile:${opts.fileID}`;
    const cached = await this.cacheManager?.get(cacheKey);
    if (cached) {
      try {
        return { srk: JSON.parse(cached) as T, srkUrl: file.url };
      } catch (e) {
        console.error('JSON.parse the ssr api cache string failed, the cache may be broken:', cacheKey, cached);
        await this.cacheManager?.del(cacheKey);
      }
    }

    const response = await this.fetchFile(this.resolveFileUrl(file.url));
    if (!response.ok) {
      throw new HttpException(response.status, response.statusText);
    }
    switch ((response.headers.get('content-type') || '').split(';')[0]) {
      case 'application/json': {
        const plain = await response.text();
        await this.cacheManager?.setEx(cacheKey, 24 * 60 * 60, plain);
        return { srk: JSON.parse(plain) as T, srkUrl: file.url };
      }
      default:
        throw new Error('Unknown srk content type');
    }
  }

  public async getRanklist(opts: { uniqueKey: string }): Promise<IApiRanklist> {
    try {
      const info = await this.getRanklistInfo({ uniqueKey: opts.uniqueKey });
      const { srk: ranklist, srkUrl } = await this.getSrkFile({ fileID: info.fileID });
      return {
        info,
        srk: ranklist,
        srkUrl,
      };
    } catch (e) {
      if (isApiNotFoundError(e)) {
        throw new LogicException(LogicExceptionKind.NotFound);
      }
      throw e;
    }
  }

  public async searchRanklist(opts: { kw?: string }) {
    return this.legacyApi.get<{ ranks: IApiRanklistInfo[] }>(urlcat('/rank/search', { query: opts.kw }));
  }

  public async listAllRanklists() {
    const response = await this.apiClient.getPublicContests();
    return {
      ranks: response.contests
        .filter((contest): contest is ContestSummaryDTO & { srkFileID: string } => Boolean(contest.srkFileID))
        .map((contest) => mapContestToRanklistInfo(contest, contest.srkFileID))
        .sort(compareRanklistInfoNewestFirst),
    };
  }

  public async getCollection(opts: { uniqueKey: string }) {
    try {
      const cacheKey = `rankland_ssr_api_cache:getCollection:${opts.uniqueKey}`;
      const cached = await this.cacheManager?.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as IApiCollection;
      }
      const response = await this.apiClient.getPublicCollection({ uk: opts.uniqueKey });
      const collection = response.content as unknown as IApiCollection;
      await this.cacheManager?.setEx(cacheKey, 60, JSON.stringify(collection));
      return collection;
    } catch (e) {
      if (isApiNotFoundError(e)) {
        throw new LogicException(LogicExceptionKind.NotFound);
      }
      throw e;
    }
  }

  public getStatistics() {
    return this.apiClient.getPublicStatistics() as Promise<IApiStatistics>;
  }

  public getLiveRanklistInfo(opts: { uniqueKey: string }): Promise<IApiLiveRanklistInfo> {
    return this.legacyApi
      .get<IApiLiveRanklistInfo>(
        urlcat('/ranking/config/:uniqueKey', { uniqueKey: opts.uniqueKey, _t: Date.now() }),
      )
      .catch((e) => {
        if (isApiNotFoundError(e)) {
          throw new LogicException(LogicExceptionKind.NotFound);
        }
        throw e;
      });
  }

  public getLiveRanklist(opts: { id: string; token?: string }): Promise<srk.Ranklist> {
    return this.legacyApi
      .get<srk.Ranklist>(
        urlcat('/ranking/:id', { id: opts.id, token: opts.token || undefined, _t: Date.now() }),
      )
      .catch((e) => {
        if (isApiNotFoundError(e)) {
          throw new LogicException(LogicExceptionKind.NotFound);
        }
        throw e;
      });
  }
}

function isApiNotFoundError(error: unknown) {
  return (
    (error instanceof ApiRequestException
      && [ErrCode.ContestNotFound, ErrCode.FileNotFound, ErrCode.CollectionNotFound].includes(error.code))
    ||
    (error instanceof ApiException
      && (error.code === LEGACY_API_NOT_FOUND_CODE || error.code === ErrCode.ContestNotFound))
    || (error instanceof HttpException && error.status === 404)
  );
}

function mapContestToRanklistInfo(
  contest: GetPublicContestRespDTO | ContestSummaryDTO,
  srkFileID: string,
): IApiRanklistInfo {
  const summary = contest as ContestSummaryDTO;
  return {
    id: contest._id,
    uniqueKey: contest.uk,
    name: contest.name,
    fileID: srkFileID,
    viewCnt: contest.viewCount,
    createdAt: summary.createdAt,
    updatedAt: summary.updatedAt,
  };
}

function compareRanklistInfoNewestFirst(a: IApiRanklistInfo, b: IApiRanklistInfo): number {
  const aCreatedAt = Date.parse(a.createdAt ?? '');
  const bCreatedAt = Date.parse(b.createdAt ?? '');
  if (Number.isFinite(aCreatedAt) && Number.isFinite(bCreatedAt) && aCreatedAt !== bCreatedAt) {
    return bCreatedAt - aCreatedAt;
  }
  return compareDecimalStringsDesc(a.id, b.id);
}

function compareDecimalStringsDesc(a: string, b: string): number {
  const normalizedA = a.replace(/^0+/, '') || '0';
  const normalizedB = b.replace(/^0+/, '') || '0';
  if (normalizedA.length !== normalizedB.length) {
    return normalizedB.length - normalizedA.length;
  }
  return normalizedA === normalizedB ? 0 : normalizedA < normalizedB ? 1 : -1;
}
