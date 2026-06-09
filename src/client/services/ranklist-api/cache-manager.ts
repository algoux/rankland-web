import type { CacheManager } from './types';

interface MemoryCacheManagerOptions {
  maxEntries?: number;
}

interface CacheEntry {
  expiredAt: number;
  value: string;
}

export class MemoryCacheManager implements CacheManager {
  private readonly maxEntries: number;
  private readonly cache = new Map<string, CacheEntry>();

  public constructor(options: MemoryCacheManagerOptions = {}) {
    this.maxEntries = options.maxEntries || 500;
  }

  public async get(key: string): Promise<string | undefined> {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiredAt <= Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  public async set(key: string, value: string): Promise<void> {
    this.setEntry(key, value, Number.POSITIVE_INFINITY);
  }

  public async setEx(key: string, seconds: number, value: string): Promise<void> {
    this.setEntry(key, value, Date.now() + seconds * 1000);
  }

  public async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  private setEntry(key: string, value: string, expiredAt: number) {
    this.cache.delete(key);
    this.cache.set(key, { expiredAt, value });
    while (this.cache.size > this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey === undefined) {
        return;
      }
      this.cache.delete(firstKey);
    }
  }
}
