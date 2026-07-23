import * as mysql2 from 'mysql2';
import type { Pool, PoolConnection, PoolOptions, QueryError } from 'mysql2';
import { mysqlPoolMetrics } from './mysql-pool-metrics';

export const MYSQL_UTC_SESSION_SQL = "SET SESSION time_zone = '+00:00'";
export const DEFAULT_MYSQL_UTC_SESSION_TIMEOUT_MS = 10_000;

type AcquireCallback = (error: NodeJS.ErrnoException | QueryError | null, connection?: PoolConnection) => unknown;

/**
 * Makes session UTC initialization part of acquiring a mysql2 connection.
 * TypeORM cannot use the connection until the initialization query succeeds.
 */
export function wrapMysql2PoolWithUtcSession(pool: Pool): Pool {
  const acquireConnection = pool.getConnection.bind(pool);
  mysqlPoolMetrics.registerPool(pool);

  pool.getConnection = ((callback: Parameters<Pool['getConnection']>[0]) => {
    mysqlPoolMetrics.recordAcquireStarted(pool);
    const complete = callback as AcquireCallback;
    const sessionTimeoutMs = getSessionTimeoutMs(pool);
    const boundAcquisition = isFailFastAcquisition(pool);
    const acquisitionStartedAt = Date.now();
    let completed = false;
    let connection: PoolConnection | undefined;
    let deadlineTimer: NodeJS.Timeout | undefined;

    const destroyConnection = (candidate = connection) => {
      if (!candidate) {
        return;
      }
      try {
        candidate.destroy();
      } catch {
        // Preserve the acquisition/session error that made the connection unsafe.
      }
    };
    const finish = (error?: NodeJS.ErrnoException | QueryError) => {
      if (completed) {
        return;
      }
      completed = true;
      if (deadlineTimer) {
        clearTimeout(deadlineTimer);
      }
      if (error) {
        mysqlPoolMetrics.recordAcquireFailed(error);
        destroyConnection();
        complete(error);
        return;
      }
      mysqlPoolMetrics.recordAcquireSucceeded();
      complete(null, connection);
    };
    const startDeadline = (timeoutMs: number) => {
      deadlineTimer = setTimeout(() => finish(sessionTimeoutError(sessionTimeoutMs)), timeoutMs);
      deadlineTimer.unref?.();
    };
    if (boundAcquisition) {
      startDeadline(sessionTimeoutMs);
    }

    try {
      acquireConnection((acquireError, acquiredConnection) => {
        if (completed) {
          destroyConnection(acquiredConnection);
          return;
        }
        connection = acquiredConnection;
        if (acquireError) {
          finish(acquireError);
          return;
        }
        if (!connection) {
          finish(Object.assign(new Error('MySQL pool did not return a connection'), { code: 'POOL_NO_CONNECTION' }));
          return;
        }
        const remainingMs = boundAcquisition
          ? sessionTimeoutMs - (Date.now() - acquisitionStartedAt)
          : sessionTimeoutMs;
        if (remainingMs < 1) {
          finish(sessionTimeoutError(sessionTimeoutMs));
          return;
        }
        if (!boundAcquisition) {
          startDeadline(sessionTimeoutMs);
        }

        try {
          connection.query({ sql: MYSQL_UTC_SESSION_SQL, timeout: remainingMs }, (sessionError) => {
            finish(sessionError ?? undefined);
          });
        } catch (error) {
          finish(error as NodeJS.ErrnoException);
        }
      });
      // mysql2 appends a waiter to _connectionQueue synchronously. Sampling after
      // getConnection returns captures short-lived queue pressure that neither the
      // pre-acquire nor completion samples can observe.
      mysqlPoolMetrics.observePool(pool);
    } catch (error) {
      finish(error as NodeJS.ErrnoException);
    }
  }) as Pool['getConnection'];

  return pool;
}

function getSessionTimeoutMs(pool: Pool): number {
  const configured = (
    pool as Pool & {
      config?: {
        connectionConfig?: {
          connectTimeout?: number;
        };
      };
    }
  ).config?.connectionConfig?.connectTimeout;
  return Number.isSafeInteger(configured) && Number(configured) > 0
    ? Number(configured)
    : DEFAULT_MYSQL_UTC_SESSION_TIMEOUT_MS;
}

function isFailFastAcquisition(pool: Pool): boolean {
  return (
    pool as Pool & {
      config?: {
        waitForConnections?: boolean;
      };
    }
  ).config?.waitForConnections === false;
}

function sessionTimeoutError(timeoutMs: number): NodeJS.ErrnoException {
  return Object.assign(new Error(`MySQL UTC session initialization exceeded ${timeoutMs}ms deadline`), {
    code: 'PROTOCOL_SEQUENCE_TIMEOUT',
    syscall: 'query',
  });
}

function createPool(options: PoolOptions | string): Pool {
  return wrapMysql2PoolWithUtcSession(mysql2.createPool(options as PoolOptions));
}

function createPoolCluster(): never {
  throw new Error('MySQL replication is not supported by the UTC session connector');
}

export const mysql2UtcConnector: typeof mysql2 = {
  ...mysql2,
  createPool: createPool as typeof mysql2.createPool,
  createPoolCluster: createPoolCluster as typeof mysql2.createPoolCluster,
};
