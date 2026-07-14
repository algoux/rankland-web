import type { Pool, PoolConnection, QueryError } from 'mysql2';
import { DataSource } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import { MYSQL_UTC_SESSION_SQL, mysql2UtcConnector, wrapMysql2PoolWithUtcSession } from './mysql2-utc-connector';

describe('mysql2 UTC connector', () => {
  it('does not expose an acquired connection until its session time zone is UTC', () => {
    const fixture = createPoolFixture();
    const pool = wrapMysql2PoolWithUtcSession(fixture.pool);
    const acquired = vi.fn();

    pool.getConnection(acquired);

    expect(fixture.connection.query).toHaveBeenCalledWith(MYSQL_UTC_SESSION_SQL, expect.any(Function));
    expect(acquired).not.toHaveBeenCalled();

    fixture.resolveSessionQuery();

    expect(acquired).toHaveBeenCalledWith(null, fixture.connection);
  });

  it('destroys the connection and propagates a session initialization error', () => {
    const fixture = createPoolFixture();
    const pool = wrapMysql2PoolWithUtcSession(fixture.pool);
    const acquired = vi.fn();
    const error = Object.assign(new Error('SET failed'), { code: 'ER_UNKNOWN_ERROR' }) as QueryError;

    pool.getConnection(acquired);
    fixture.resolveSessionQuery(error);

    expect(fixture.connection.destroy).toHaveBeenCalledOnce();
    expect(acquired).toHaveBeenCalledWith(error);
  });

  it('passes through an acquire error without trying to initialize a session', () => {
    const error = Object.assign(new Error('pool unavailable'), { code: 'ECONNREFUSED' });
    const getConnection = vi.fn((callback: (error: NodeJS.ErrnoException) => void) => callback(error));
    const pool = wrapMysql2PoolWithUtcSession({ getConnection } as unknown as Pool);
    const acquired = vi.fn();

    pool.getConnection(acquired);

    expect(acquired).toHaveBeenCalledWith(error);
  });

  it('reinitializes the UTC session on every acquisition, including a reused connection', () => {
    const fixture = createPoolFixture();
    const pool = wrapMysql2PoolWithUtcSession(fixture.pool);

    pool.getConnection(vi.fn());
    fixture.resolveSessionQuery();
    pool.getConnection(vi.fn());
    fixture.resolveSessionQuery();

    expect(fixture.connection.query).toHaveBeenCalledTimes(2);
  });

  it('makes TypeORM initialization fail when the UTC session cannot be established', async () => {
    const fixture = createPoolFixture();
    const end = vi.fn((callback: (error: NodeJS.ErrnoException | null) => void) => callback(null));
    const driver = {
      ...mysql2UtcConnector,
      createPool: vi.fn(() => wrapMysql2PoolWithUtcSession({ ...fixture.pool, end } as unknown as Pool)),
    };
    const dataSource = new DataSource({
      type: 'mysql',
      database: 'rankland',
      driver,
      entities: [],
    });
    const error = Object.assign(new Error('SET failed'), { code: 'ER_UNKNOWN_ERROR' }) as QueryError;
    const initializing = dataSource.initialize();

    fixture.resolveSessionQuery(error);

    await expect(initializing).rejects.toBe(error);
    expect(fixture.connection.destroy).toHaveBeenCalledOnce();
    expect(end).toHaveBeenCalledOnce();
  });

  it('fails closed when replication requests a pool cluster', () => {
    expect(() => mysql2UtcConnector.createPoolCluster()).toThrow(/replication.*not supported/i);
  });
});

function createPoolFixture() {
  let sessionQueryCallback: ((error: QueryError | null) => void) | undefined;
  const connection = {
    destroy: vi.fn(),
    query: vi.fn((_sql: string, callback: (error: QueryError | null) => void) => {
      sessionQueryCallback = callback;
    }),
  } as unknown as PoolConnection;
  const getConnection = vi.fn((callback: (error: NodeJS.ErrnoException | null, connection: PoolConnection) => void) =>
    callback(null, connection),
  );
  const pool = { getConnection } as unknown as Pool;

  return {
    connection,
    pool,
    resolveSessionQuery(error: QueryError | null = null) {
      if (!sessionQueryCallback) {
        throw new Error('session query was not started');
      }
      const callback = sessionQueryCallback;
      sessionQueryCallback = undefined;
      callback(error);
    },
  };
}
