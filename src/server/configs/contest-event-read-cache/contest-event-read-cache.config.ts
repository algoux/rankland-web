import { Config } from 'bwcx-ljsm';

export type ContestEventReadCacheMode = 'off' | 'shadow' | 'on';

@Config()
export default class ContestEventReadCacheConfig {
  public readonly mode = parseMode(process.env.CONTEST_EVENT_READ_CACHE_MODE);
  public readonly maxBytes = parsePositiveInteger('CONTEST_EVENT_READ_CACHE_MAX_BYTES', 256 * 1024 * 1024);
  public readonly maxEntryBytes = parsePositiveInteger('CONTEST_EVENT_READ_CACHE_MAX_ENTRY_BYTES', 128 * 1024 * 1024);
  public readonly idleTtlMs = parsePositiveInteger('CONTEST_EVENT_READ_CACHE_IDLE_TTL_MS', 15 * 60 * 1000);
  public readonly authorityLeaseMs = parsePositiveInteger('CONTEST_EVENT_READ_CACHE_AUTHORITY_LEASE_MS', 6_000);
  public readonly hotAuthorityRefreshMs = parsePositiveInteger(
    'CONTEST_EVENT_READ_CACHE_HOT_AUTHORITY_REFRESH_MS',
    3_000,
  );
  public readonly reconciliationMaxMs = parsePositiveInteger('CONTEST_EVENT_READ_CACHE_RECONCILIATION_MAX_MS', 5_000);
  public readonly chunkEventCount = parsePositiveInteger('CONTEST_EVENT_READ_CACHE_CHUNK_EVENT_COUNT', 512);
  public readonly maxSynchronousProjectionChunks = parsePositiveInteger(
    'CONTEST_EVENT_READ_CACHE_MAX_SYNCHRONOUS_PROJECTION_CHUNKS',
    32,
  );
  public readonly hydrationConcurrency = parsePositiveInteger('CONTEST_EVENT_READ_CACHE_HYDRATION_CONCURRENCY', 2);
  public readonly hydrationPageSize = parsePositiveInteger('CONTEST_EVENT_READ_CACHE_HYDRATION_PAGE_SIZE', 2_000);
  public readonly fallbackConcurrency = parsePositiveInteger('CONTEST_EVENT_READ_CACHE_FALLBACK_CONCURRENCY', 4);
  public readonly fallbackQueueSize = parseNonNegativeInteger('CONTEST_EVENT_READ_CACHE_FALLBACK_QUEUE_SIZE', 32);
  public readonly fallbackQueueTimeoutMs = parsePositiveInteger(
    'CONTEST_EVENT_READ_CACHE_FALLBACK_QUEUE_TIMEOUT_MS',
    1_000,
  );
  public readonly retryAfterSeconds = parsePositiveInteger('CONTEST_EVENT_READ_CACHE_RETRY_AFTER_SECONDS', 1);
  public readonly queryTimeoutMs = parsePositiveInteger('CONTEST_EVENT_READ_CACHE_QUERY_TIMEOUT_MS', 1_000);
  public readonly failureCooldownMs = parsePositiveInteger('CONTEST_EVENT_READ_CACHE_FAILURE_COOLDOWN_MS', 1_000);
  public readonly poolAcquireRetryAttempts = parsePositiveInteger(
    'CONTEST_EVENT_READ_CACHE_POOL_ACQUIRE_RETRY_ATTEMPTS',
    16,
  );
  public readonly poolAcquireRetryMinDelayMs = parsePositiveInteger(
    'CONTEST_EVENT_READ_CACHE_POOL_ACQUIRE_RETRY_MIN_DELAY_MS',
    5,
  );
  public readonly poolAcquireRetryMaxDelayMs = parsePositiveInteger(
    'CONTEST_EVENT_READ_CACHE_POOL_ACQUIRE_RETRY_MAX_DELAY_MS',
    50,
  );
  public readonly bootstrapAuthorityCoalescingEnabled = parseBoolean(
    'CONTEST_EVENT_READ_CACHE_BOOTSTRAP_AUTHORITY_COALESCING_ENABLED',
    true,
  );
  public readonly eagerTailFillEnabled = parseBoolean('CONTEST_EVENT_READ_CACHE_EAGER_TAIL_FILL_ENABLED', false);
  public readonly eagerNotifyWaitMs = parseNonNegativeInteger('CONTEST_EVENT_READ_CACHE_EAGER_NOTIFY_WAIT_MS', 250);
  public readonly summaryIntervalMs = parsePositiveInteger('CONTEST_EVENT_READ_CACHE_SUMMARY_INTERVAL_MS', 60_000);
  public readonly onCompareSampleRate = parseRate('CONTEST_EVENT_READ_CACHE_ON_COMPARE_SAMPLE_RATE', 0);

  public constructor() {
    if (this.maxEntryBytes > this.maxBytes) {
      throw new RangeError('contest event read cache maxEntryBytes must not exceed maxBytes');
    }
    if (this.chunkEventCount > 65_535) {
      throw new RangeError('contest event read cache chunkEventCount must not exceed 65535');
    }
    if (this.hotAuthorityRefreshMs >= this.authorityLeaseMs) {
      throw new RangeError('contest event read cache hotAuthorityRefreshMs must be lower than authorityLeaseMs');
    }
    if (this.reconciliationMaxMs > this.authorityLeaseMs) {
      throw new RangeError('contest event read cache reconciliationMaxMs must not exceed authorityLeaseMs');
    }
    if (this.poolAcquireRetryMaxDelayMs < this.poolAcquireRetryMinDelayMs) {
      throw new RangeError('contest event read cache pool retry maximum delay must be at least the minimum delay');
    }
  }
}

function parseMode(raw: string | undefined): ContestEventReadCacheMode {
  const value = raw?.trim() || 'on';
  if (value !== 'off' && value !== 'shadow' && value !== 'on') {
    throw new RangeError('CONTEST_EVENT_READ_CACHE_MODE must be off, shadow, or on');
  }
  return value;
}

function parsePositiveInteger(name: string, fallback: number): number {
  const value = parseInteger(name, fallback);
  if (value < 1) {
    throw new RangeError(`${name} must be a positive integer`);
  }
  return value;
}

function parseNonNegativeInteger(name: string, fallback: number): number {
  const value = parseInteger(name, fallback);
  if (value < 0) {
    throw new RangeError(`${name} must be a non-negative integer`);
  }
  return value;
}

function parseInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${name} must be a safe integer`);
  }
  return value;
}

function parseRate(name: string, fallback: number): number {
  const raw = process.env[name];
  const value = raw === undefined || raw.trim() === '' ? fallback : Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 0.001) {
    throw new RangeError(`${name} must be between 0 and 0.001`);
  }
  return value;
}

function parseBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }
  const value = raw.trim().toLocaleLowerCase('en-US');
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  throw new RangeError(`${name} must be true or false`);
}
