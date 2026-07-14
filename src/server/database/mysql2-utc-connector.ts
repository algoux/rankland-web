import * as mysql2 from 'mysql2';
import type { Pool, PoolConnection, PoolOptions, QueryError } from 'mysql2';

export const MYSQL_UTC_SESSION_SQL = "SET SESSION time_zone = '+00:00'";

type AcquireCallback = (error: NodeJS.ErrnoException | QueryError | null, connection?: PoolConnection) => unknown;

/**
 * Makes session UTC initialization part of acquiring a mysql2 connection.
 * TypeORM cannot use the connection until the initialization query succeeds.
 */
export function wrapMysql2PoolWithUtcSession(pool: Pool): Pool {
  const acquireConnection = pool.getConnection.bind(pool);

  pool.getConnection = ((callback: Parameters<Pool['getConnection']>[0]) => {
    const complete = callback as AcquireCallback;

    acquireConnection((acquireError, connection) => {
      if (acquireError) {
        complete(acquireError);
        return;
      }

      const fail = (error: NodeJS.ErrnoException | QueryError) => {
        try {
          connection.destroy();
        } catch {
          // Preserve the session initialization error that made the connection unsafe.
        }
        complete(error);
      };

      try {
        connection.query(MYSQL_UTC_SESSION_SQL, (sessionError) => {
          if (sessionError) {
            fail(sessionError);
            return;
          }
          complete(null, connection);
        });
      } catch (error) {
        fail(error as NodeJS.ErrnoException);
      }
    });
  }) as Pool['getConnection'];

  return pool;
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
