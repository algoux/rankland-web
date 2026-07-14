export const SNOWFLAKE_EPOCH_MS = Date.UTC(2026, 0, 1);

const WORKER_ID_BITS = 10n;
const SEQUENCE_BITS = 12n;
const TIMESTAMP_SHIFT = WORKER_ID_BITS + SEQUENCE_BITS;
const WORKER_ID_SHIFT = SEQUENCE_BITS;
const MAX_WORKER_ID = Number((1n << WORKER_ID_BITS) - 1n);
const MAX_SEQUENCE = Number((1n << SEQUENCE_BITS) - 1n);
const MAX_TIMESTAMP_DELTA_MS = Number((1n << 41n) - 1n);

export interface SnowflakeIdGeneratorOptions {
  workerId: number;
  maxClockBackwardMs?: number;
  now?: () => number;
}

/**
 * Generates signed-safe 63-bit Snowflake IDs.
 *
 * The generator is intentionally synchronous: callers can assign an ID while
 * building an entity, and the only wait path is sequence exhaustion within one
 * millisecond. Values must be persisted and serialized as decimal strings.
 */
export class SnowflakeIdGenerator {
  private readonly workerId: number;
  private readonly maxClockBackwardMs: number;
  private readonly now: () => number;
  private lastTimestampMs = -1;
  private sequence = 0;

  public constructor(options: SnowflakeIdGeneratorOptions) {
    if (!Number.isInteger(options.workerId) || options.workerId < 0 || options.workerId > MAX_WORKER_ID) {
      throw new RangeError(`workerId must be an integer between 0 and ${MAX_WORKER_ID}`);
    }

    const maxClockBackwardMs = options.maxClockBackwardMs ?? 50;
    if (!Number.isSafeInteger(maxClockBackwardMs) || maxClockBackwardMs < 0) {
      throw new RangeError('maxClockBackwardMs must be a non-negative safe integer');
    }

    this.workerId = options.workerId;
    this.maxClockBackwardMs = maxClockBackwardMs;
    this.now = options.now ?? Date.now;
  }

  public nextId(): string {
    let timestampMs = this.readTimestampMs();

    if (this.lastTimestampMs >= 0 && timestampMs < this.lastTimestampMs) {
      const backwardMs = this.lastTimestampMs - timestampMs;
      if (backwardMs > this.maxClockBackwardMs) {
        throw new Error(`Clock moved backwards by ${backwardMs}ms; refusing to generate an ID`);
      }
      timestampMs = this.lastTimestampMs;
    }

    if (timestampMs === this.lastTimestampMs) {
      if (this.sequence === MAX_SEQUENCE) {
        timestampMs = this.waitForNextTimestamp(this.lastTimestampMs);
        this.sequence = 0;
      } else {
        this.sequence += 1;
      }
    } else {
      this.sequence = 0;
    }

    this.lastTimestampMs = timestampMs;
    const timestampDelta = BigInt(timestampMs - SNOWFLAKE_EPOCH_MS);
    const value =
      (timestampDelta << TIMESTAMP_SHIFT) | (BigInt(this.workerId) << WORKER_ID_SHIFT) | BigInt(this.sequence);
    return value.toString();
  }

  private readTimestampMs(): number {
    const timestampMs = this.now();
    if (!Number.isSafeInteger(timestampMs)) {
      throw new RangeError('Clock must return a safe integer timestamp in milliseconds');
    }

    const timestampDelta = timestampMs - SNOWFLAKE_EPOCH_MS;
    if (timestampDelta < 0) {
      throw new RangeError('Clock timestamp is before the Snowflake epoch');
    }
    if (timestampDelta > MAX_TIMESTAMP_DELTA_MS) {
      throw new RangeError('Clock timestamp exceeds the Snowflake 41-bit range');
    }
    return timestampMs;
  }

  private waitForNextTimestamp(previousTimestampMs: number): number {
    let timestampMs = this.readTimestampMs();
    while (timestampMs <= previousTimestampMs) {
      timestampMs = this.readTimestampMs();
    }
    return timestampMs;
  }
}
