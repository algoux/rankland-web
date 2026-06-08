import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryCacheManager } from './cache-manager';

describe('MemoryCacheManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores values with setEx TTL measured in seconds', async () => {
    const cache = new MemoryCacheManager();

    await cache.setEx('k1', 60, 'value');

    expect(await cache.get('k1')).toBe('value');
    vi.advanceTimersByTime(59_999);
    expect(await cache.get('k1')).toBe('value');
    vi.advanceTimersByTime(2);
    expect(await cache.get('k1')).toBeUndefined();
  });

  it('deletes values and evicts least-recently-used entries', async () => {
    const cache = new MemoryCacheManager({ maxEntries: 2 });

    await cache.set('a', 'A');
    await cache.set('b', 'B');
    expect(await cache.get('a')).toBe('A');
    await cache.set('c', 'C');

    expect(await cache.get('a')).toBe('A');
    expect(await cache.get('b')).toBeUndefined();
    await cache.del('a');
    expect(await cache.get('a')).toBeUndefined();
  });
});
