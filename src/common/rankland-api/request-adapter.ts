export interface RanklandApiRequestOptions {
  getResponse?: boolean;
}

export interface RanklandApiRequestAdapter {
  get<T = unknown>(url: string, opts?: RanklandApiRequestOptions): Promise<T>;
}

export interface RanklandApiCache {
  get(key: string): Promise<unknown>;
  setEx(key: string, ttlSeconds: number, value: string): Promise<void>;
  del(key: string): Promise<void>;
}
