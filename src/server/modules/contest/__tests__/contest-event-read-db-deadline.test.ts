import type { Pool, PoolConnection } from 'mysql2';
import type { QueryRunner } from 'typeorm';
import { wrapMysql2PoolWithUtcSession } from '@server/database/mysql2-utc-connector';
import ContestEventReadBulkhead from '../contest-event-read-bulkhead';
import {
  ContestEventReadDatabaseDeadlineError,
  runTypeOrmReadWithAcquisitionRetry,
  runTypeOrmReadWithDeadline,
} from '../contest-event-read-db-deadline';
import { contestEventReadMetrics } from '../contest-event-read-metrics';

describe('contest event database read deadline', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('times out a hung connection acquisition, frees the bulkhead slot, and destroys a late connection', async () => {
    vi.useFakeTimers();
    let resolveConnection!: (connection: { destroy: () => void }) => void;
    const lateConnection = { destroy: vi.fn() };
    const runner = {
      connect: vi.fn(
        () =>
          new Promise((resolve) => {
            resolveConnection = resolve;
          }),
      ),
      release: vi.fn(async () => undefined),
      manager: {},
    } as unknown as QueryRunner;
    const bulkhead = new ContestEventReadBulkhead(1, 1, 1_000);

    const first = bulkhead.run(() => runTypeOrmReadWithDeadline(runner, 50, async () => 'late'));
    const firstRejected = expect(first).rejects.toMatchObject({
      name: 'ContestEventReadDatabaseDeadlineError',
      phase: 'acquire',
    });
    const second = bulkhead.run(async () => 'next');

    await vi.advanceTimersByTimeAsync(50);

    await firstRejected;
    await expect(second).resolves.toBe('next');
    resolveConnection(lateConnection);
    await vi.advanceTimersByTimeAsync(0);
    expect(lateConnection.destroy).toHaveBeenCalledOnce();
  });

  it('destroys an acquired connection when a query never returns', async () => {
    vi.useFakeTimers();
    const connection = { destroy: vi.fn() };
    const runner = {
      connect: vi.fn(async () => connection),
      release: vi.fn(async () => undefined),
      manager: {},
    } as unknown as QueryRunner;
    let markQueryStarted!: () => void;
    const queryStarted = new Promise<void>((resolve) => {
      markQueryStarted = resolve;
    });

    const read = runTypeOrmReadWithDeadline(runner, 50, async () => {
      markQueryStarted();
      return new Promise<never>(() => undefined);
    });
    const rejected = expect(read).rejects.toMatchObject({
      name: 'ContestEventReadDatabaseDeadlineError',
      phase: 'query',
    });
    await queryStarted;

    await vi.advanceTimersByTimeAsync(50);

    await rejected;
    expect(connection.destroy).toHaveBeenCalledOnce();
  });

  it('uses one fail-fast mysql2 acquisition and restores the shared pool configuration synchronously', async () => {
    const poolConfig = {
      waitForConnections: true,
      connectionConfig: { connectTimeout: 10_000 },
    };
    const runner = {
      driver: { pool: { config: poolConfig } },
      connect: vi.fn(() => {
        expect(poolConfig).toMatchObject({
          waitForConnections: false,
          connectionConfig: { connectTimeout: 50 },
        });
        return Promise.reject(new Error('No connections available.'));
      }),
      release: vi.fn(async () => undefined),
      manager: {},
      isTransactionActive: false,
    } as unknown as QueryRunner;

    await expect(runTypeOrmReadWithDeadline(runner, 50, async () => undefined)).rejects.toThrow(
      /No connections available/,
    );
    expect(poolConfig).toEqual({
      waitForConnections: true,
      connectionConfig: { connectTimeout: 10_000 },
    });
  });

  it('retries fail-fast pool exhaustion with a fresh runner inside one absolute deadline', async () => {
    vi.useFakeTimers();
    const before = contestEventReadMetrics.snapshot();
    const connection = { destroy: vi.fn(), release: vi.fn() };
    const runners = [
      queryRunnerWithConnectionResult(() => Promise.reject(new Error('No connections available.'))),
      queryRunnerWithConnectionResult(() => Promise.reject(new Error('No connections available.'))),
      queryRunnerWithConnectionResult(() => Promise.resolve(connection)),
    ];
    const createRunner = vi.fn(() => {
      const runner = runners.shift();
      if (!runner) throw new Error('unexpected extra runner');
      return runner;
    });
    const read = vi.fn(async () => 'ready');

    const result = runTypeOrmReadWithAcquisitionRetry(createRunner, 50, read, undefined, {
      maximumAttempts: 3,
      minimumDelayMs: 5,
      maximumDelayMs: 5,
      random: () => 1,
    });
    await vi.advanceTimersByTimeAsync(10);

    await expect(result).resolves.toBe('ready');
    expect(createRunner).toHaveBeenCalledTimes(3);
    expect(read).toHaveBeenCalledOnce();
    const after = contestEventReadMetrics.snapshot();
    expect(after.databaseReadAcquireRetries - before.databaseReadAcquireRetries).toBe(2);
    expect(after.databaseReadAcquireRetrySuccesses - before.databaseReadAcquireRetrySuccesses).toBe(1);
    expect(after.databaseReadAcquireRetryExhausted - before.databaseReadAcquireRetryExhausted).toBe(0);
  });

  it('does not retry a non-pool acquisition error', async () => {
    const failure = new Error('authentication failed');
    const createRunner = vi.fn(() => queryRunnerWithConnectionResult(() => Promise.reject(failure)));

    await expect(
      runTypeOrmReadWithAcquisitionRetry(createRunner, 50, async () => 'unreachable', undefined, {
        maximumAttempts: 3,
        minimumDelayMs: 5,
        maximumDelayMs: 5,
      }),
    ).rejects.toBe(failure);

    expect(createRunner).toHaveBeenCalledOnce();
  });

  it('does not retry a query error that only mimics the pool exhaustion message', async () => {
    const connection = { destroy: vi.fn(), release: vi.fn() };
    const createRunner = vi.fn(() => queryRunnerWithConnectionResult(() => Promise.resolve(connection)));
    const read = vi.fn(async () => {
      throw new Error('No connections available.');
    });

    await expect(
      runTypeOrmReadWithAcquisitionRetry(createRunner, 50, read, undefined, {
        maximumAttempts: 3,
        minimumDelayMs: 5,
        maximumDelayMs: 5,
      }),
    ).rejects.toThrow(/No connections available/);

    expect(createRunner).toHaveBeenCalledOnce();
    expect(read).toHaveBeenCalledOnce();
  });

  it('counts retry exhaustion when the absolute budget expires before the next attempt', async () => {
    const before = contestEventReadMetrics.snapshot();
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValue(100);
    const createRunner = vi.fn(() =>
      queryRunnerWithConnectionResult(() => Promise.reject(new Error('No connections available.'))),
    );

    await expect(
      runTypeOrmReadWithAcquisitionRetry(createRunner, 100, async () => 'unreachable', undefined, {
        maximumAttempts: 3,
        minimumDelayMs: 5,
        maximumDelayMs: 5,
        random: () => 0,
      }),
    ).rejects.toMatchObject({ name: 'ContestEventReadDatabaseDeadlineError', phase: 'acquire' });

    expect(createRunner).toHaveBeenCalledOnce();
    const after = contestEventReadMetrics.snapshot();
    expect(after.databaseReadAcquireRetries - before.databaseReadAcquireRetries).toBe(1);
    expect(after.databaseReadAcquireRetryExhausted - before.databaseReadAcquireRetryExhausted).toBe(1);
    now.mockRestore();
  });

  it('bounds persistent pool exhaustion by the configured attempt count', async () => {
    vi.useFakeTimers();
    const before = contestEventReadMetrics.snapshot();
    const createRunner = vi.fn(() =>
      queryRunnerWithConnectionResult(() => Promise.reject(new Error('No connections available.'))),
    );

    const result = runTypeOrmReadWithAcquisitionRetry(createRunner, 100, async () => 'unreachable', undefined, {
      maximumAttempts: 3,
      minimumDelayMs: 5,
      maximumDelayMs: 10,
      random: () => 1,
    });
    const rejected = expect(result).rejects.toThrow(/No connections available/);
    await vi.advanceTimersByTimeAsync(15);

    await rejected;
    expect(createRunner).toHaveBeenCalledTimes(3);
    const after = contestEventReadMetrics.snapshot();
    expect(after.databaseReadAcquireRetries - before.databaseReadAcquireRetries).toBe(2);
    expect(after.databaseReadAcquireRetrySuccesses - before.databaseReadAcquireRetrySuccesses).toBe(0);
    expect(after.databaseReadAcquireRetryExhausted - before.databaseReadAcquireRetryExhausted).toBe(1);
  });

  it('destroys a raw connection hidden behind hung UTC session initialization and permits the next acquisition', async () => {
    vi.useFakeTimers();
    const hungConnection = {
      destroy: vi.fn(),
      release: vi.fn(),
      query: vi.fn(() => undefined),
    } as unknown as PoolConnection;
    const healthyConnection = {
      destroy: vi.fn(),
      release: vi.fn(),
      query: vi.fn((_query, callback) => callback(null, [])),
    } as unknown as PoolConnection;
    const available = [hungConnection, healthyConnection];
    const rawPool = {
      config: {
        waitForConnections: true,
        connectionConfig: { connectTimeout: 10_000 },
      },
      getConnection: vi.fn((callback) => callback(null, available.shift())),
    } as unknown as Pool;
    const pool = wrapMysql2PoolWithUtcSession(rawPool);

    const first = runTypeOrmReadWithDeadline(queryRunnerForPool(pool), 50, async () => 'hidden');
    const rejected = expect(first).rejects.toBeInstanceOf(ContestEventReadDatabaseDeadlineError);
    await vi.advanceTimersByTimeAsync(50);

    await rejected;
    expect(hungConnection.destroy).toHaveBeenCalledOnce();
    await expect(runTypeOrmReadWithDeadline(queryRunnerForPool(pool), 50, async () => 'next')).resolves.toBe('next');
    expect(healthyConnection.release).toHaveBeenCalledOnce();
  });

  it('destroys a transaction connection when rollback cannot prove the session is clean', async () => {
    const connection = { destroy: vi.fn(), release: vi.fn() };
    const readError = new Error('read failed');
    const runner = {
      connect: vi.fn(async () => connection),
      startTransaction: vi.fn(async function (this: { isTransactionActive: boolean }) {
        this.isTransactionActive = true;
      }),
      rollbackTransaction: vi.fn(async () => {
        throw new Error('rollback failed');
      }),
      commitTransaction: vi.fn(),
      release: vi.fn(async () => undefined),
      manager: {},
      isTransactionActive: false,
    } as unknown as QueryRunner;

    await expect(
      runTypeOrmReadWithDeadline(
        runner,
        1_000,
        async () => {
          throw readError;
        },
        'REPEATABLE READ',
      ),
    ).rejects.toBe(readError);

    expect(connection.destroy).toHaveBeenCalledOnce();
  });
});

function queryRunnerForPool(pool: Pool): QueryRunner {
  let connection: PoolConnection | undefined;
  const runner = {
    driver: { pool },
    connect: vi.fn(
      () =>
        new Promise<PoolConnection>((resolve, reject) => {
          pool.getConnection((error, acquired) => {
            if (error || !acquired) {
              reject(error ?? new Error('pool did not return a connection'));
              return;
            }
            connection = acquired;
            resolve(acquired);
          });
        }),
    ),
    release: vi.fn(async () => connection?.release()),
    manager: {},
    isTransactionActive: false,
  } as unknown as QueryRunner;
  return runner;
}

function queryRunnerWithConnectionResult(result: () => Promise<unknown>): QueryRunner {
  return {
    connect: vi.fn(result),
    release: vi.fn(async () => undefined),
    manager: {},
    isTransactionActive: false,
  } as unknown as QueryRunner;
}
