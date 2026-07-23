import { afterEach, describe, expect, it } from 'vitest';
import ContestEventReadCacheConfig from './contest-event-read-cache.config';

const keys = [
  'CONTEST_EVENT_READ_CACHE_MODE',
  'CONTEST_EVENT_READ_CACHE_MAX_BYTES',
  'CONTEST_EVENT_READ_CACHE_MAX_ENTRY_BYTES',
  'CONTEST_EVENT_READ_CACHE_AUTHORITY_LEASE_MS',
  'CONTEST_EVENT_READ_CACHE_QUERY_TIMEOUT_MS',
  'CONTEST_EVENT_READ_CACHE_FAILURE_COOLDOWN_MS',
  'CONTEST_EVENT_READ_CACHE_POOL_ACQUIRE_RETRY_ATTEMPTS',
  'CONTEST_EVENT_READ_CACHE_POOL_ACQUIRE_RETRY_MIN_DELAY_MS',
  'CONTEST_EVENT_READ_CACHE_POOL_ACQUIRE_RETRY_MAX_DELAY_MS',
  'CONTEST_EVENT_READ_CACHE_BOOTSTRAP_AUTHORITY_COALESCING_ENABLED',
  'CONTEST_EVENT_READ_CACHE_EAGER_TAIL_FILL_ENABLED',
  'CONTEST_EVENT_READ_CACHE_EAGER_NOTIFY_WAIT_MS',
  'CONTEST_EVENT_READ_CACHE_ON_COMPARE_SAMPLE_RATE',
] as const;
const original = new Map(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    const value = original.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('ContestEventReadCacheConfig', () => {
  it('defaults to the production on mode without background comparison reads', () => {
    for (const key of keys) delete process.env[key];

    expect(new ContestEventReadCacheConfig()).toMatchObject({
      mode: 'on',
      maxBytes: 268_435_456,
      maxEntryBytes: 134_217_728,
      authorityLeaseMs: 6_000,
      hotAuthorityRefreshMs: 3_000,
      reconciliationMaxMs: 5_000,
      chunkEventCount: 512,
      hydrationConcurrency: 2,
      fallbackConcurrency: 4,
      fallbackQueueSize: 32,
      retryAfterSeconds: 1,
      queryTimeoutMs: 1_000,
      failureCooldownMs: 1_000,
      poolAcquireRetryAttempts: 16,
      poolAcquireRetryMinDelayMs: 5,
      poolAcquireRetryMaxDelayMs: 50,
      bootstrapAuthorityCoalescingEnabled: true,
      eagerTailFillEnabled: false,
      eagerNotifyWaitMs: 250,
      onCompareSampleRate: 0,
    });
  });

  it('rejects unsafe modes and budgets instead of silently falling back', () => {
    process.env.CONTEST_EVENT_READ_CACHE_MODE = 'enabled';
    expect(() => new ContestEventReadCacheConfig()).toThrow(/mode/i);

    process.env.CONTEST_EVENT_READ_CACHE_MODE = 'on';
    process.env.CONTEST_EVENT_READ_CACHE_MAX_BYTES = '1024';
    process.env.CONTEST_EVENT_READ_CACHE_MAX_ENTRY_BYTES = '2048';
    expect(() => new ContestEventReadCacheConfig()).toThrow(/maxEntryBytes/i);
  });

  it('rejects an acquire retry delay range whose maximum is lower than its minimum', () => {
    for (const key of keys) delete process.env[key];
    process.env.CONTEST_EVENT_READ_CACHE_POOL_ACQUIRE_RETRY_MIN_DELAY_MS = '50';
    process.env.CONTEST_EVENT_READ_CACHE_POOL_ACQUIRE_RETRY_MAX_DELAY_MS = '5';

    expect(() => new ContestEventReadCacheConfig()).toThrow(/retry.*maximum/i);
  });

  it('parses explicit P0 experiment switches and rejects ambiguous booleans', () => {
    for (const key of keys) delete process.env[key];
    process.env.CONTEST_EVENT_READ_CACHE_BOOTSTRAP_AUTHORITY_COALESCING_ENABLED = 'false';
    process.env.CONTEST_EVENT_READ_CACHE_EAGER_TAIL_FILL_ENABLED = 'false';
    process.env.CONTEST_EVENT_READ_CACHE_EAGER_NOTIFY_WAIT_MS = '0';
    process.env.CONTEST_EVENT_READ_CACHE_ON_COMPARE_SAMPLE_RATE = '0.001';

    expect(new ContestEventReadCacheConfig()).toMatchObject({
      bootstrapAuthorityCoalescingEnabled: false,
      eagerTailFillEnabled: false,
      eagerNotifyWaitMs: 0,
      onCompareSampleRate: 0.001,
    });

    process.env.CONTEST_EVENT_READ_CACHE_EAGER_TAIL_FILL_ENABLED = 'yes';
    expect(() => new ContestEventReadCacheConfig()).toThrow(/EAGER_TAIL_FILL_ENABLED.*true.*false/i);
  });
});
