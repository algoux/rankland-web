import { Inject, Provide } from 'bwcx-core';
import type Redis from 'ioredis';
import HttpException from '@server/exceptions/http.exception';
import { RedisClientId } from '@server/container-ids';

export const RANKLIST_CACHE_KEY = 'rankland:ranklist:listall:v1';
export const RANKLIST_CACHE_TTL_SECONDS = 5 * 60;
export const RANKLAND_API_BASE_SERVER = process.env.API_BASE_SERVER || 'https://rl-api.algoux.cn';

type RedisLike = Pick<Redis, 'get' | 'setex' | 'del'> & { status?: Redis['status'] };
type FetchLike = typeof fetch;

export interface IApiRanklistInfo {
  id: string;
  uniqueKey: string;
  name: string;
  fileID: string;
  viewCnt: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface RanklistRequestOptions {
  apiBaseServer?: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
}

interface RankListAllResponse {
  code?: number;
  message?: string;
  data?: {
    ranks?: unknown[];
  };
}

@Provide()
export class RanklistService {
  public constructor(
    @Inject(RedisClientId)
    private readonly redis?: RedisLike,
  ) {}

  public async getAllRanklists(options: RanklistRequestOptions = {}): Promise<IApiRanklistInfo[]> {
    const cached = await this.readCachedRanklists();
    if (cached) {
      return cached;
    }

    try {
      const ranklists = await this.fetchRanklists(options);
      await this.writeCachedRanklists(ranklists);
      return ranklists;
    } catch (error) {
      console.warn('[Ranklist] failed to refresh ranklists:', error);
      throw new HttpException(502);
    }
  }

  private async readCachedRanklists() {
    if (!this.isRedisReady()) {
      return undefined;
    }

    try {
      const cached = await this.redis.get(RANKLIST_CACHE_KEY);
      if (typeof cached !== 'string') {
        return undefined;
      }
      const parsed = JSON.parse(cached);
      return validateRanklistInfoList(parsed);
    } catch (error) {
      console.warn('[Ranklist] failed to read Redis cache, falling back to RL API:', error);
      await this.deleteCachedRanklists();
      return undefined;
    }
  }

  private async writeCachedRanklists(ranklists: IApiRanklistInfo[]) {
    if (!this.isRedisReady()) {
      return;
    }

    try {
      await this.redis.setex(RANKLIST_CACHE_KEY, RANKLIST_CACHE_TTL_SECONDS, JSON.stringify(ranklists));
    } catch (error) {
      console.warn('[Ranklist] failed to write Redis cache, continuing without cache:', error);
    }
  }

  private async deleteCachedRanklists() {
    if (!this.isRedisReady()) {
      return;
    }

    try {
      await this.redis.del(RANKLIST_CACHE_KEY);
    } catch (error) {
      console.warn('[Ranklist] failed to delete broken Redis cache:', error);
    }
  }

  private async fetchRanklists(options: RanklistRequestOptions) {
    const fetchImpl = options.fetchImpl || fetch;
    const apiBaseServer = options.apiBaseServer || RANKLAND_API_BASE_SERVER;
    const response = await fetchWithTimeout(
      fetchImpl,
      joinUrl(apiBaseServer, '/rank/listall'),
      options.timeoutMs || 5_000,
    );

    if (!response.ok) {
      throw new Error(`RL API responded with ${response.status} ${response.statusText}`);
    }

    const payload = await response.json() as RankListAllResponse;
    if (payload.code !== 0 || !Array.isArray(payload.data?.ranks)) {
      throw new Error(`RL API returned an invalid /rank/listall payload: ${payload.message || 'unknown error'}`);
    }

    return validateRanklistInfoList(payload.data.ranks);
  }

  private isRedisReady() {
    return Boolean(this.redis && (!this.redis.status || this.redis.status === 'ready'));
  }
}

export default RanklistService;

export function validateRanklistInfoList(input: unknown): IApiRanklistInfo[] {
  if (!Array.isArray(input)) {
    throw new Error('ranklist list payload must be an array');
  }

  return input.flatMap((item) => {
    if (!isRecord(item) || typeof item.uniqueKey !== 'string' || typeof item.fileID !== 'string') {
      return [];
    }

    const uniqueKey = item.uniqueKey.trim();
    const fileID = item.fileID.trim();
    if (!uniqueKey || !fileID) {
      return [];
    }

    return [{
      id: typeof item.id === 'string' ? item.id : uniqueKey,
      uniqueKey,
      name: typeof item.name === 'string' && item.name.trim() ? item.name : uniqueKey,
      fileID,
      viewCnt: typeof item.viewCnt === 'number' && Number.isFinite(item.viewCnt) ? item.viewCnt : 0,
      content: typeof item.content === 'string' ? item.content : '',
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
      updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : '',
    }];
  });
}

async function fetchWithTimeout(fetchImpl: FetchLike, url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function joinUrl(baseUrl: string, pathname: string) {
  return `${baseUrl.replace(/\/+$/, '')}/${pathname.replace(/^\/+/, '')}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
