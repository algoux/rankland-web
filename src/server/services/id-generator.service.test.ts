import { afterEach, describe, expect, it, vi } from 'vitest';

import TypeOrmClient from '@server/database/typeorm-client';
import type IdGeneratorConfig from '@server/configs/id-generator/id-generator.config';
import { SNOWFLAKE_EPOCH_MS } from '@server/lib/snowflake-id';
import IdGeneratorService from './id-generator.service';

const TIMESTAMP_SHIFT = 22n;
const WORKER_SHIFT = 12n;
const WORKER_MASK = 0x3ffn;

afterEach(() => {
  vi.useRealTimers();
});

describe('IdGeneratorService', () => {
  it('refuses to generate ids before initialization', () => {
    const service = new IdGeneratorService(unusedTypeOrmClient(), config());

    expect(() => service.nextId()).toThrow(/not initialized/i);
  });

  it('supports an explicit worker override for tests and tooling without touching MySQL', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(SNOWFLAKE_EPOCH_MS + 1_000);
    const service = new IdGeneratorService(unusedTypeOrmClient(), config({ workerIdOverride: 17 }));

    await service.init();
    const id = BigInt(service.nextId());

    expect((id >> WORKER_SHIFT) & WORKER_MASK).toBe(17n);
    await service.dispose();
  });

  it('claims an available MySQL worker slot and fences it after the prior timestamp reservation', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(SNOWFLAKE_EPOCH_MS + 1_000);
    const previousReservedUntilMs = SNOWFLAKE_EPOCH_MS + 5_000;
    const harness = databaseHarness({
      registrationId: '1025',
      previousReservedUntilMs: String(previousReservedUntilMs),
      acquire: (workerId) => workerId === 2,
    });
    const service = new IdGeneratorService(harness.typeOrmClient, config());

    await service.init();
    const id = BigInt(service.nextId());

    expect((id >> WORKER_SHIFT) & WORKER_MASK).toBe(2n);
    expect(id >> TIMESTAMP_SHIFT).toBe(5_001n);
    expect(harness.repository.update).toHaveBeenCalledWith(
      { id: '1025' },
      expect.objectContaining({
        workerId: 2,
        reservedUntilMs: expect.any(String),
      }),
    );

    await service.dispose();

    expect(harness.releasedLocks).toEqual(['rankland:snowflake-worker:2']);
    expect(harness.queryRunner.release).toHaveBeenCalledOnce();
  });

  it('fails startup when all 1024 worker slots are already owned', async () => {
    const harness = databaseHarness({
      registrationId: '2048',
      previousReservedUntilMs: null,
      acquire: () => false,
    });
    const service = new IdGeneratorService(harness.typeOrmClient, config());

    await expect(service.init()).rejects.toThrow(/no Snowflake worker slots are available/i);

    expect(harness.queryRunner.release).toHaveBeenCalledOnce();
  });

  it('fails startup when its initial timestamp reservation cannot be persisted', async () => {
    const harness = databaseHarness({
      registrationId: '2049',
      previousReservedUntilMs: null,
      acquire: () => true,
      initialAffected: 0,
    });
    const service = new IdGeneratorService(harness.typeOrmClient, config());

    await expect(service.init()).rejects.toThrow(/initial Snowflake timestamp reservation/i);

    expect(harness.releasedLocks).toEqual(['rankland:snowflake-worker:1']);
    expect(harness.queryRunner.release).toHaveBeenCalledOnce();
  });

  it('fails closed when the ownership heartbeat no longer sees its named lock', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(SNOWFLAKE_EPOCH_MS + 1_000);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const harness = databaseHarness({
      registrationId: '3073',
      previousReservedUntilMs: null,
      acquire: () => true,
      heartbeatOwned: false,
    });
    const service = new IdGeneratorService(harness.typeOrmClient, config());

    try {
      await service.init();
      await vi.advanceTimersByTimeAsync(2_000);

      expect(() => service.nextId()).toThrow(/ownership is not available/i);
    } finally {
      await service.dispose();
      errorSpy.mockRestore();
    }
  });

  it('fails closed when its persisted timestamp reservation can no longer be renewed', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(SNOWFLAKE_EPOCH_MS + 1_000);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const harness = databaseHarness({
      registrationId: '4097',
      previousReservedUntilMs: null,
      acquire: () => true,
      renewalAffected: 0,
    });
    const service = new IdGeneratorService(harness.typeOrmClient, config());

    try {
      await service.init();
      await vi.advanceTimersByTimeAsync(2_000);

      expect(() => service.nextId()).toThrow(/ownership is not available/i);
    } finally {
      await service.dispose();
      errorSpy.mockRestore();
    }
  });

  it('renews its fence and recovers after the clock moves beyond the current reservation', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(SNOWFLAKE_EPOCH_MS + 1_000);
    const harness = databaseHarness({
      registrationId: '5121',
      previousReservedUntilMs: null,
      acquire: () => true,
    });
    const service = new IdGeneratorService(harness.typeOrmClient, config());

    try {
      await service.init();
      vi.setSystemTime(SNOWFLAKE_EPOCH_MS + 12_000);

      expect(() => service.nextId()).toThrow(/timestamp reservation expired/i);
      await vi.advanceTimersByTimeAsync(0);

      const recoveredId = BigInt(service.nextId());
      expect(recoveredId >> TIMESTAMP_SHIFT).toBe(12_000n);
      expect(harness.repository.update).toHaveBeenCalledTimes(2);
    } finally {
      await service.dispose();
    }
  });

  it('serializes immediate and heartbeat renewal targets while a fence update is in flight', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(SNOWFLAKE_EPOCH_MS + 1_000);
    let completeRenewal!: () => void;
    const renewalGate = new Promise<void>((resolve) => {
      completeRenewal = resolve;
    });
    const harness = databaseHarness({
      registrationId: '6145',
      previousReservedUntilMs: null,
      acquire: () => true,
      renewalGate,
    });
    const service = new IdGeneratorService(harness.typeOrmClient, config());

    try {
      await service.init();
      vi.setSystemTime(SNOWFLAKE_EPOCH_MS + 12_000);

      expect(() => service.nextId()).toThrow(/timestamp reservation expired/i);
      await vi.advanceTimersByTimeAsync(0);
      expect(() => service.nextId()).toThrow(/timestamp reservation expired/i);
      await vi.advanceTimersByTimeAsync(2_000);

      expect(harness.repository.update).toHaveBeenCalledTimes(2);

      completeRenewal();
      await vi.advanceTimersByTimeAsync(0);

      expect(() => service.nextId()).not.toThrow();
      expect(harness.repository.update).toHaveBeenCalledTimes(3);
    } finally {
      completeRenewal();
      await service.dispose();
    }
  });

  it('persists a newer overrun target after an older heartbeat update is already in flight', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(SNOWFLAKE_EPOCH_MS + 1_000);
    let completeRenewal!: () => void;
    const renewalGate = new Promise<void>((resolve) => {
      completeRenewal = resolve;
    });
    const harness = databaseHarness({
      registrationId: '7169',
      previousReservedUntilMs: null,
      acquire: () => true,
      renewalGate,
    });
    const service = new IdGeneratorService(harness.typeOrmClient, config());

    try {
      await service.init();
      await vi.advanceTimersByTimeAsync(2_000);
      expect(harness.repository.update).toHaveBeenCalledTimes(2);

      vi.setSystemTime(SNOWFLAKE_EPOCH_MS + 14_000);
      expect(() => service.nextId()).toThrow(/timestamp reservation expired/i);

      completeRenewal();
      await vi.advanceTimersByTimeAsync(0);

      expect(harness.repository.update).toHaveBeenCalledTimes(3);
      expect(BigInt(service.nextId()) >> TIMESTAMP_SHIFT).toBe(14_000n);
    } finally {
      completeRenewal();
      await service.dispose();
    }
  });
});

function config(overrides: Partial<IdGeneratorConfig> = {}): IdGeneratorConfig {
  const value: IdGeneratorConfig = {
    workerIdOverride: undefined,
    ...overrides,
  };
  return value;
}

function unusedTypeOrmClient(): TypeOrmClient {
  const client = Object.create(TypeOrmClient.prototype) as TypeOrmClient;
  client.getDataSource = () => {
    throw new Error('MySQL should not be used');
  };
  return client;
}

function databaseHarness(options: {
  registrationId: string;
  previousReservedUntilMs: string | null;
  acquire: (workerId: number) => boolean;
  heartbeatOwned?: boolean;
  initialAffected?: number;
  renewalAffected?: number;
  renewalGate?: Promise<void>;
}) {
  const releasedLocks: string[] = [];
  let updateCount = 0;
  const repository = {
    create: vi.fn((value) => ({ ...value })),
    save: vi.fn(async (value) => Object.assign(value, { id: options.registrationId })),
    update: vi.fn(async () => {
      updateCount += 1;
      if (updateCount > 1) {
        await options.renewalGate;
      }
      return {
        affected: updateCount === 1 ? options.initialAffected ?? 1 : options.renewalAffected ?? 1,
      };
    }),
  };
  const rawConnection = {
    on: vi.fn(),
    off: vi.fn(),
  };
  const queryRunner = {
    manager: {
      getRepository: vi.fn(() => repository),
    },
    connect: vi.fn(async () => rawConnection),
    query: vi.fn(async (sql: string, params: unknown[] = []) => {
      if (sql.includes('IS_USED_LOCK')) {
        return [{ ownerConnectionId: options.heartbeatOwned === false ? 41 : 42, connectionId: 42 }];
      }
      if (sql.includes('GET_LOCK')) {
        const workerId = Number(String(params[0]).split(':').at(-1));
        return [{ acquired: options.acquire(workerId) ? 1 : 0 }];
      }
      if (sql.includes('MAX(`reserved_until_ms`)')) {
        return [{ reservedUntilMs: options.previousReservedUntilMs }];
      }
      if (sql.includes('RELEASE_LOCK')) {
        releasedLocks.push(String(params[0]));
        return [{ released: 1 }];
      }
      throw new Error(`Unexpected query: ${sql}`);
    }),
    release: vi.fn(async () => undefined),
  };
  const typeOrmClient = {
    getDataSource: () => ({
      createQueryRunner: () => queryRunner,
    }),
  } as unknown as TypeOrmClient;

  return { typeOrmClient, queryRunner, repository, releasedLocks };
}
