import { describe, expect, it } from 'vitest';

import { SNOWFLAKE_EPOCH_MS, SnowflakeIdGenerator } from './snowflake-id';

const TIMESTAMP_SHIFT = 22n;
const WORKER_SHIFT = 12n;
const WORKER_MASK = 0x3ffn;
const SEQUENCE_MASK = 0xfffn;

describe('SnowflakeIdGenerator', () => {
  it('encodes timestamp, worker, and sequence into a signed-safe decimal string', () => {
    const now = SNOWFLAKE_EPOCH_MS + 12_345;
    const generator = new SnowflakeIdGenerator({ workerId: 513, now: () => now });

    const value = BigInt(generator.nextId());

    expect(value >> TIMESTAMP_SHIFT).toBe(12_345n);
    expect((value >> WORKER_SHIFT) & WORKER_MASK).toBe(513n);
    expect(value & SEQUENCE_MASK).toBe(0n);
    expect(value).toBeLessThanOrEqual(0x7fff_ffff_ffff_ffffn);
    expect(value.toString()).toMatch(/^\d+$/);
  });

  it('produces strictly increasing unique ids for one worker', () => {
    const now = SNOWFLAKE_EPOCH_MS + 20_000;
    const generator = new SnowflakeIdGenerator({ workerId: 7, now: () => now });

    const ids = Array.from({ length: 100 }, () => BigInt(generator.nextId()));

    expect(new Set(ids.map(String))).toHaveLength(ids.length);
    expect(ids.every((id, index) => index === 0 || id > ids[index - 1])).toBe(true);
  });

  it('rolls the sequence over to the next millisecond after 4096 ids', () => {
    const base = SNOWFLAKE_EPOCH_MS + 30_000;
    const timestamps = [...Array(4097).fill(base), base + 1];
    let readIndex = 0;
    const generator = new SnowflakeIdGenerator({
      workerId: 9,
      now: () => timestamps[Math.min(readIndex++, timestamps.length - 1)],
    });

    const ids = Array.from({ length: 4097 }, () => BigInt(generator.nextId()));
    const last = ids.at(-1)!;

    expect(last >> TIMESTAMP_SHIFT).toBe(30_001n);
    expect(last & SEQUENCE_MASK).toBe(0n);
    expect(new Set(ids.map(String))).toHaveLength(ids.length);
  });

  it('keeps monotonicity through a small clock rollback', () => {
    const base = SNOWFLAKE_EPOCH_MS + 40_000;
    const timestamps = [base + 10, base + 8, base + 10];
    let readIndex = 0;
    const generator = new SnowflakeIdGenerator({
      workerId: 11,
      now: () => timestamps[Math.min(readIndex++, timestamps.length - 1)],
      maxClockBackwardMs: 50,
    });

    const ids = timestamps.map(() => BigInt(generator.nextId()));

    expect(ids[1]).toBeGreaterThan(ids[0]);
    expect(ids[2]).toBeGreaterThan(ids[1]);
    expect(ids.map((id) => id >> TIMESTAMP_SHIFT)).toEqual([40_010n, 40_010n, 40_010n]);
  });

  it('fails loudly when the clock moves backwards beyond the configured tolerance', () => {
    const base = SNOWFLAKE_EPOCH_MS + 50_000;
    const timestamps = [base + 100, base + 49];
    let readIndex = 0;
    const generator = new SnowflakeIdGenerator({
      workerId: 12,
      now: () => timestamps[Math.min(readIndex++, timestamps.length - 1)],
      maxClockBackwardMs: 50,
    });

    generator.nextId();

    expect(() => generator.nextId()).toThrow(/clock moved backwards by 51ms/i);
  });

  it('keeps ids disjoint across workers generating in the same millisecond', () => {
    const now = SNOWFLAKE_EPOCH_MS + 60_000;
    const first = new SnowflakeIdGenerator({ workerId: 1, now: () => now });
    const second = new SnowflakeIdGenerator({ workerId: 2, now: () => now });

    const firstIds = Array.from({ length: 100 }, () => first.nextId());
    const secondIds = Array.from({ length: 100 }, () => second.nextId());

    expect(new Set([...firstIds, ...secondIds])).toHaveLength(200);
    expect(BigInt(secondIds[0])).toBeGreaterThan(BigInt(firstIds.at(-1)!));
  });

  it('rejects invalid worker ids and timestamps outside the 41-bit range', () => {
    expect(() => new SnowflakeIdGenerator({ workerId: -1 })).toThrow(/workerId/i);
    expect(() => new SnowflakeIdGenerator({ workerId: 1024 })).toThrow(/workerId/i);
    expect(() => new SnowflakeIdGenerator({ workerId: 1.5 })).toThrow(/workerId/i);

    const beforeEpoch = new SnowflakeIdGenerator({ workerId: 1, now: () => SNOWFLAKE_EPOCH_MS - 1 });
    const afterRange = new SnowflakeIdGenerator({
      workerId: 1,
      now: () => SNOWFLAKE_EPOCH_MS + 2 ** 41,
    });

    expect(() => beforeEpoch.nextId()).toThrow(/epoch/i);
    expect(() => afterRange.nextId()).toThrow(/41-bit/i);
  });
});
