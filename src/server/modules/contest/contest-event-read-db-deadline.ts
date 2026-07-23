import type { EntityManager, QueryRunner } from 'typeorm';
import { isMysql2PoolUnavailableError } from '@server/database/mysql-pool-metrics';
import { contestEventReadMetrics } from './contest-event-read-metrics';

type TransactionIsolation = NonNullable<Parameters<QueryRunner['startTransaction']>[0]>;

export type ContestEventReadDatabaseDeadlinePhase =
  | 'acquire'
  | 'transaction-start'
  | 'query'
  | 'transaction-commit'
  | 'transaction-rollback'
  | 'release';

interface DestroyableConnection {
  destroy?: () => void;
  release?: () => void;
}

interface MysqlPoolConfigLike {
  waitForConnections?: boolean;
  connectionConfig?: {
    connectTimeout?: number;
  };
}

interface MysqlQueryRunnerLike {
  driver?: {
    pool?: {
      config?: MysqlPoolConfigLike;
    };
    poolCluster?: unknown;
  };
}

export class ContestEventReadDatabaseUnavailableError extends Error {
  public constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ContestEventReadDatabaseUnavailableError';
  }
}

export class ContestEventReadDatabaseDeadlineError extends ContestEventReadDatabaseUnavailableError {
  public constructor(
    public readonly timeoutMs: number,
    public readonly phase: ContestEventReadDatabaseDeadlinePhase = 'query',
  ) {
    super(`contest event database read exceeded ${timeoutMs}ms deadline during ${phase}`);
    this.name = 'ContestEventReadDatabaseDeadlineError';
  }
}

export class ContestEventReadPoolAcquisitionUnavailableError extends ContestEventReadDatabaseUnavailableError {
  public constructor(cause: Error) {
    super(cause.message, cause);
    this.name = 'ContestEventReadPoolAcquisitionUnavailableError';
  }
}

export interface ContestEventReadAcquireRetryOptions {
  maximumAttempts: number;
  minimumDelayMs: number;
  maximumDelayMs: number;
  random?: () => number;
}

export async function runTypeOrmReadWithAcquisitionRetry<T>(
  createQueryRunner: () => QueryRunner,
  timeoutMs: number,
  read: (manager: EntityManager) => Promise<T>,
  isolationLevel: TransactionIsolation | undefined,
  options: ContestEventReadAcquireRetryOptions,
): Promise<T> {
  assertAcquireRetryOptions(options);
  const startedAt = Date.now();
  const random = options.random ?? Math.random;
  let encounteredPoolExhaustion = false;
  for (let attempt = 1; attempt <= options.maximumAttempts; attempt += 1) {
    const remainingMs = timeoutMs - (Date.now() - startedAt);
    if (remainingMs < 1) {
      if (encounteredPoolExhaustion) {
        contestEventReadMetrics.add('databaseReadAcquireRetryExhausted');
      }
      throw new ContestEventReadDatabaseDeadlineError(timeoutMs, 'acquire');
    }
    try {
      const result = await runTypeOrmReadWithDeadline(createQueryRunner(), remainingMs, read, isolationLevel);
      if (attempt > 1) {
        contestEventReadMetrics.add('databaseReadAcquireRetrySuccesses');
      }
      return result;
    } catch (error) {
      if (!(error instanceof ContestEventReadPoolAcquisitionUnavailableError)) {
        throw error;
      }
      encounteredPoolExhaustion = true;
      if (attempt === options.maximumAttempts) {
        contestEventReadMetrics.add('databaseReadAcquireRetryExhausted');
        throw error;
      }
      contestEventReadMetrics.add('databaseReadAcquireRetries');
      const remainingAfterAttemptMs = timeoutMs - (Date.now() - startedAt);
      if (remainingAfterAttemptMs < 2) {
        contestEventReadMetrics.add('databaseReadAcquireRetryExhausted');
        throw new ContestEventReadDatabaseDeadlineError(timeoutMs, 'acquire');
      }
      const exponentialCap = Math.min(
        options.maximumDelayMs,
        options.minimumDelayMs * 2 ** Math.min(attempt - 1, 30),
        remainingAfterAttemptMs - 1,
      );
      const delayMs = Math.max(0, Math.floor(random() * exponentialCap));
      if (delayMs > 0) {
        await wait(delayMs);
      }
    }
  }
  throw new ContestEventReadDatabaseDeadlineError(timeoutMs, 'acquire');
}

/**
 * Bounds the complete TypeORM read lifecycle, including pool acquisition and
 * transaction setup. A timed-out runner is released immediately; an acquired
 * socket is destroyed so a hung query cannot keep using a pool connection.
 * If acquisition resolves late, that connection is destroyed before any query
 * can run and its result is never published to the caller.
 */
export async function runTypeOrmReadWithDeadline<T>(
  queryRunner: QueryRunner,
  timeoutMs: number,
  read: (manager: EntityManager) => Promise<T>,
  isolationLevel?: TransactionIsolation,
): Promise<T> {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1) {
    throw new RangeError('contest event database read timeout must be a positive integer');
  }

  let phase: ContestEventReadDatabaseDeadlinePhase = 'acquire';
  let expired = false;
  let discardConnection = false;
  let connection: DestroyableConnection | undefined;
  let destroyedConnection: DestroyableConnection | undefined;

  const destroyConnection = () => {
    if (!connection || connection === destroyedConnection) {
      return;
    }
    destroyedConnection = connection;
    try {
      if (typeof connection.destroy === 'function') {
        connection.destroy();
      } else {
        connection.release?.();
      }
    } catch (_error) {
      // The request is already failing closed; cleanup errors must not hide the deadline.
    }
  };
  const releaseRunnerWithoutWaiting = () => {
    try {
      Promise.resolve(queryRunner.release()).catch(() => undefined);
    } catch (_error) {
      // See cleanup note above.
    }
  };
  const assertWithinDeadline = () => {
    if (expired) {
      destroyConnection();
      throw new ContestEventReadDatabaseDeadlineError(timeoutMs, phase);
    }
  };

  let deadlineTimer!: NodeJS.Timeout;
  const deadline = new Promise<never>((_resolve, reject) => {
    deadlineTimer = setTimeout(() => {
      expired = true;
      destroyConnection();
      releaseRunnerWithoutWaiting();
      reject(new ContestEventReadDatabaseDeadlineError(timeoutMs, phase));
    }, timeoutMs);
    deadlineTimer.unref?.();
  });

  const operation = (async () => {
    try {
      try {
        connection = (await connectWithoutMysqlPoolQueue(queryRunner, timeoutMs)) as DestroyableConnection;
      } catch (error) {
        if (isMysql2PoolUnavailableError(error)) {
          throw new ContestEventReadPoolAcquisitionUnavailableError(error);
        }
        throw error;
      }
      assertWithinDeadline();
      if (isolationLevel) {
        phase = 'transaction-start';
        await queryRunner.startTransaction(isolationLevel);
        assertWithinDeadline();
      }
      phase = 'query';
      const result = await read(queryRunner.manager);
      assertWithinDeadline();
      if (isolationLevel) {
        phase = 'transaction-commit';
        await queryRunner.commitTransaction();
        assertWithinDeadline();
      }
      return result;
    } catch (error) {
      if (!expired && queryRunner.isTransactionActive) {
        try {
          phase = 'transaction-rollback';
          await queryRunner.rollbackTransaction();
        } catch (_rollbackError) {
          discardConnection = true;
          destroyConnection();
          // Preserve the read failure, but never reuse a session whose rollback was not proven.
        }
        if (queryRunner.isTransactionActive) {
          discardConnection = true;
          destroyConnection();
        }
      }
      throw error;
    } finally {
      if (expired || discardConnection) {
        destroyConnection();
        releaseRunnerWithoutWaiting();
      } else {
        phase = 'release';
        await queryRunner.release();
      }
    }
  })();
  operation.catch(() => undefined);

  try {
    return await Promise.race([operation, deadline]);
  } finally {
    clearTimeout(deadlineTimer);
  }
}

function connectWithoutMysqlPoolQueue(queryRunner: QueryRunner, timeoutMs: number): Promise<unknown> {
  const driver = (queryRunner as QueryRunner & MysqlQueryRunnerLike).driver;
  const poolConfig = driver?.poolCluster ? undefined : driver?.pool?.config;
  if (!poolConfig) {
    return queryRunner.connect();
  }

  // mysql2 has no cancellable getConnection API. Its pool reads these options
  // synchronously, so this one acquisition can fail fast without changing the
  // shared setting across an await boundary. This prevents timed-out readers
  // from accumulating callbacks in mysql2's internal connection queue.
  const hadWaitForConnections = Object.prototype.hasOwnProperty.call(poolConfig, 'waitForConnections');
  const previousWaitForConnections = poolConfig.waitForConnections;
  const connectionConfig = poolConfig.connectionConfig;
  const hadConnectTimeout = connectionConfig
    ? Object.prototype.hasOwnProperty.call(connectionConfig, 'connectTimeout')
    : false;
  const previousConnectTimeout = connectionConfig?.connectTimeout;
  poolConfig.waitForConnections = false;
  if (connectionConfig) {
    connectionConfig.connectTimeout =
      typeof previousConnectTimeout === 'number' && previousConnectTimeout > 0
        ? Math.min(previousConnectTimeout, timeoutMs)
        : timeoutMs;
  }
  try {
    return queryRunner.connect();
  } finally {
    restoreProperty(poolConfig, 'waitForConnections', hadWaitForConnections, previousWaitForConnections);
    if (connectionConfig) {
      restoreProperty(connectionConfig, 'connectTimeout', hadConnectTimeout, previousConnectTimeout);
    }
  }
}

function restoreProperty<T extends object, K extends keyof T>(target: T, key: K, existed: boolean, value: T[K]): void {
  if (existed) {
    target[key] = value;
  } else {
    delete target[key];
  }
}

function assertAcquireRetryOptions(options: ContestEventReadAcquireRetryOptions): void {
  if (!Number.isSafeInteger(options.maximumAttempts) || options.maximumAttempts < 1) {
    throw new RangeError('contest event pool retry maximumAttempts must be a positive integer');
  }
  if (!Number.isSafeInteger(options.minimumDelayMs) || options.minimumDelayMs < 1) {
    throw new RangeError('contest event pool retry minimumDelayMs must be a positive integer');
  }
  if (!Number.isSafeInteger(options.maximumDelayMs) || options.maximumDelayMs < options.minimumDelayMs) {
    throw new RangeError('contest event pool retry maximumDelayMs must be at least minimumDelayMs');
  }
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, delayMs);
    timer.unref?.();
  });
}
