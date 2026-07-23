import type { Pool, PoolConnection, QueryError } from 'mysql2';
import { DataSource } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import { MYSQL_UTC_SESSION_SQL, mysql2UtcConnector, wrapMysql2PoolWithUtcSession } from './mysql2-utc-connector';
import { mysqlPoolMetrics } from './mysql-pool-metrics';

describe('mysql2 UTC connector', () => {
  it('does not expose an acquired connection until its session time zone is UTC', () => {
    const fixture = createPoolFixture();
    const pool = wrapMysql2PoolWithUtcSession(fixture.pool);
    const acquired = vi.fn();

    pool.getConnection(acquired);

    expect(fixture.connection.query).toHaveBeenCalledWith(
      { sql: MYSQL_UTC_SESSION_SQL, timeout: 10_000 },
      expect.any(Function),
    );
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

  it('destroys a raw connection when the session initialization callback never returns', async () => {
    vi.useFakeTimers();
    try {
      const fixture = createPoolFixture(50);
      const pool = wrapMysql2PoolWithUtcSession(fixture.pool);
      const acquired = vi.fn();

      pool.getConnection(acquired);
      await vi.advanceTimersByTimeAsync(50);

      expect(fixture.connection.destroy).toHaveBeenCalledOnce();
      expect(acquired).toHaveBeenCalledOnce();
      expect(acquired.mock.calls[0][0]).toMatchObject({ code: 'PROTOCOL_SEQUENCE_TIMEOUT', syscall: 'query' });
      fixture.resolveSessionQuery();
      expect(acquired).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses one acquisition deadline and gives UTC session initialization only the remaining budget', async () => {
    vi.useFakeTimers();
    try {
      let deliverConnection!: (error: null, connection: PoolConnection) => void;
      const connection = {
        destroy: vi.fn(),
        query: vi.fn(() => undefined),
      } as unknown as PoolConnection;
      const pool = wrapMysql2PoolWithUtcSession({
        config: { waitForConnections: false, connectionConfig: { connectTimeout: 50 } },
        getConnection: vi.fn((callback) => {
          deliverConnection = callback;
        }),
      } as unknown as Pool);
      const acquired = vi.fn();

      pool.getConnection(acquired);
      await vi.advanceTimersByTimeAsync(40);
      deliverConnection(null, connection);

      const sessionOptions = vi.mocked(connection.query).mock.calls[0][0] as { timeout: number };
      expect(sessionOptions.timeout).toBeGreaterThan(0);
      expect(sessionOptions.timeout).toBeLessThanOrEqual(10);
      await vi.advanceTimersByTimeAsync(10);
      expect(connection.destroy).toHaveBeenCalledOnce();
      expect(acquired.mock.calls[0][0]).toMatchObject({ code: 'PROTOCOL_SEQUENCE_TIMEOUT' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('destroys a raw connection that arrives after the acquisition deadline', async () => {
    vi.useFakeTimers();
    try {
      let deliverConnection!: (error: null, connection: PoolConnection) => void;
      const connection = { destroy: vi.fn(), query: vi.fn() } as unknown as PoolConnection;
      const pool = wrapMysql2PoolWithUtcSession({
        config: { waitForConnections: false, connectionConfig: { connectTimeout: 50 } },
        getConnection: vi.fn((callback) => {
          deliverConnection = callback;
        }),
      } as unknown as Pool);
      const acquired = vi.fn();

      pool.getConnection(acquired);
      await vi.advanceTimersByTimeAsync(50);
      expect(acquired.mock.calls[0][0]).toMatchObject({ code: 'PROTOCOL_SEQUENCE_TIMEOUT' });

      deliverConnection(null, connection);
      expect(connection.destroy).toHaveBeenCalledOnce();
      expect(connection.query).not.toHaveBeenCalled();
      expect(acquired).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it('preserves normal waitForConnections queueing and starts the UTC timer only after acquisition', async () => {
    vi.useFakeTimers();
    try {
      let deliverConnection!: (error: null, connection: PoolConnection) => void;
      const connection = {
        destroy: vi.fn(),
        query: vi.fn((_query, callback) => callback(null, [])),
      } as unknown as PoolConnection;
      const pool = wrapMysql2PoolWithUtcSession({
        config: { waitForConnections: true, connectionConfig: { connectTimeout: 50 } },
        getConnection: vi.fn((callback) => {
          deliverConnection = callback;
        }),
      } as unknown as Pool);
      const acquired = vi.fn();

      pool.getConnection(acquired);
      await vi.advanceTimersByTimeAsync(100);
      expect(acquired).not.toHaveBeenCalled();

      deliverConnection(null, connection);
      expect(acquired).toHaveBeenCalledWith(null, connection);
      expect(connection.destroy).not.toHaveBeenCalled();
      expect(connection.query).toHaveBeenCalledWith({ sql: MYSQL_UTC_SESSION_SQL, timeout: 50 }, expect.any(Function));
    } finally {
      vi.useRealTimers();
    }
  });

  it('passes through an acquire error without trying to initialize a session', () => {
    const before = mysqlPoolMetrics.snapshot();
    const error = Object.assign(new Error('pool unavailable'), { code: 'ECONNREFUSED' });
    const getConnection = vi.fn((callback: (error: NodeJS.ErrnoException) => void) => callback(error));
    const pool = wrapMysql2PoolWithUtcSession({ getConnection } as unknown as Pool);
    const acquired = vi.fn();

    pool.getConnection(acquired);

    expect(acquired).toHaveBeenCalledWith(error);
    const after = mysqlPoolMetrics.snapshot();
    expect(after.acquireStarted - before.acquireStarted).toBe(1);
    expect(after.acquireFailed - before.acquireFailed).toBe(1);
    expect((after.acquireFailuresByCode.ECONNREFUSED ?? 0) - (before.acquireFailuresByCode.ECONNREFUSED ?? 0)).toBe(1);
  });

  it('classifies mysql2 fail-fast pool exhaustion with a stable error code', () => {
    const before = mysqlPoolMetrics.snapshot();
    const getConnection = vi.fn((callback: (error: NodeJS.ErrnoException) => void) =>
      callback(new Error('No connections available.')),
    );
    const pool = wrapMysql2PoolWithUtcSession({
      config: { waitForConnections: false },
      getConnection,
    } as unknown as Pool);
    const acquired = vi.fn();

    pool.getConnection(acquired);

    expect(acquired).toHaveBeenCalledWith(expect.objectContaining({ message: 'No connections available.' }));
    const after = mysqlPoolMetrics.snapshot();
    expect(
      (after.acquireFailuresByCode.POOL_NO_AVAILABLE ?? 0) - (before.acquireFailuresByCode.POOL_NO_AVAILABLE ?? 0),
    ).toBe(1);
    expect((after.acquireFailuresByCode.UNKNOWN ?? 0) - (before.acquireFailuresByCode.UNKNOWN ?? 0)).toBe(0);
  });

  it('reports current and high-water mysql2 pool pressure', () => {
    const pool = {
      _allConnections: { length: 10 },
      _freeConnections: { length: 3 },
      _connectionQueue: { length: 4 },
      getConnection: vi.fn(),
    } as unknown as Pool;

    mysqlPoolMetrics.registerPool(pool);
    const snapshot = mysqlPoolMetrics.snapshot();

    expect(snapshot.inUseConnections).toBeGreaterThanOrEqual(7);
    expect(snapshot.queuedAcquires).toBeGreaterThanOrEqual(4);
    expect(snapshot.highWaterInUseConnections).toBeGreaterThanOrEqual(7);
    expect(snapshot.highWaterQueuedAcquires).toBeGreaterThanOrEqual(4);
  });

  it('captures queue high-water immediately after mysql2 enqueues an acquisition', () => {
    const before = mysqlPoolMetrics.snapshot();
    const queue = { length: 0 };
    const expectedHighWater = before.highWaterQueuedAcquires + 1;
    const pool = {
      _allConnections: { length: 10 },
      _freeConnections: { length: 0 },
      _connectionQueue: queue,
      getConnection: vi.fn(() => {
        queue.length = expectedHighWater;
      }),
    } as unknown as Pool;

    wrapMysql2PoolWithUtcSession(pool).getConnection(vi.fn());

    expect(mysqlPoolMetrics.snapshot().highWaterQueuedAcquires).toBeGreaterThanOrEqual(expectedHighWater);
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

function createPoolFixture(connectTimeoutMs?: number) {
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
  const pool = {
    getConnection,
    ...(connectTimeoutMs === undefined ? {} : { config: { connectionConfig: { connectTimeout: connectTimeoutMs } } }),
  } as unknown as Pool;

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
