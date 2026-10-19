import type * as srk from '@algoux/standard-ranklist';

export interface CacheManager {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
  setEx(key: string, seconds: number, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

export interface RanklandRequestAdapter {
  get<T = unknown>(url: string, options?: { getResponse?: false }): Promise<T>;
  get<T = unknown>(url: string, options: { getResponse: true }): Promise<{ data: ReadableStream<Uint8Array> | null; response: Response }>;
}

export interface IApiRanklistInfo {
  id: string;
  uniqueKey: string;
  name: string;
  fileID: string;
  viewCnt: number;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IApiRanklist {
  info: IApiRanklistInfo;
  srk: srk.Ranklist;
  srkUrl: string;
}

export enum CollectionItemType {
  File = 1,
  Directory = 2,
}

export interface IApiCollectionItem {
  type: CollectionItemType;
  uniqueKey: string;
  name: string;
  children?: IApiCollectionItem[];
}

export interface IApiCollection {
  root: {
    children: IApiCollectionItem[];
  };
}

export interface IApiStatistics {
  totalSrkCount: number;
  totalViewCount: number;
}
