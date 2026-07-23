import type { Pool } from 'mysql2';

interface MysqlPoolInternals {
  _allConnections?: { length: number };
  _freeConnections?: { length: number };
  _connectionQueue?: { length: number };
}

export interface MysqlPoolMetricsSnapshot {
  poolCount: number;
  totalConnections: number;
  freeConnections: number;
  inUseConnections: number;
  queuedAcquires: number;
  highWaterInUseConnections: number;
  highWaterQueuedAcquires: number;
  acquireStarted: number;
  acquireSucceeded: number;
  acquireFailed: number;
  acquireFailuresByCode: Record<string, number>;
}

class MysqlPoolMetrics {
  private readonly pools = new Set<Pool>();
  private acquireStarted = 0;
  private acquireSucceeded = 0;
  private acquireFailed = 0;
  private readonly acquireFailuresByCode = new Map<string, number>();
  private highWaterInUseConnections = 0;
  private highWaterQueuedAcquires = 0;

  public registerPool(pool: Pool): void {
    this.pools.add(pool);
    this.observePoolGauges();
  }

  public recordAcquireStarted(pool: Pool): void {
    this.registerPool(pool);
    this.acquireStarted += 1;
    this.observePoolGauges();
  }

  public observePool(pool: Pool): void {
    this.registerPool(pool);
    this.observePoolGauges();
  }

  public recordAcquireSucceeded(): void {
    this.acquireSucceeded += 1;
    this.observePoolGauges();
  }

  public recordAcquireFailed(error: unknown): void {
    this.acquireFailed += 1;
    const code = mysqlErrorCode(error);
    this.acquireFailuresByCode.set(code, (this.acquireFailuresByCode.get(code) ?? 0) + 1);
    this.observePoolGauges();
  }

  public snapshot(): MysqlPoolMetricsSnapshot {
    const gauges = this.observePoolGauges();
    return {
      ...gauges,
      highWaterInUseConnections: this.highWaterInUseConnections,
      highWaterQueuedAcquires: this.highWaterQueuedAcquires,
      acquireStarted: this.acquireStarted,
      acquireSucceeded: this.acquireSucceeded,
      acquireFailed: this.acquireFailed,
      acquireFailuresByCode: Object.fromEntries(
        [...this.acquireFailuresByCode.entries()].sort(([left], [right]) => left.localeCompare(right)),
      ),
    };
  }

  private observePoolGauges(): Pick<
    MysqlPoolMetricsSnapshot,
    'poolCount' | 'totalConnections' | 'freeConnections' | 'inUseConnections' | 'queuedAcquires'
  > {
    let totalConnections = 0;
    let freeConnections = 0;
    let queuedAcquires = 0;
    for (const pool of this.pools) {
      const internals = pool as Pool & MysqlPoolInternals;
      totalConnections += safeLength(internals._allConnections);
      freeConnections += safeLength(internals._freeConnections);
      queuedAcquires += safeLength(internals._connectionQueue);
    }
    const inUseConnections = Math.max(0, totalConnections - freeConnections);
    this.highWaterInUseConnections = Math.max(this.highWaterInUseConnections, inUseConnections);
    this.highWaterQueuedAcquires = Math.max(this.highWaterQueuedAcquires, queuedAcquires);
    return {
      poolCount: this.pools.size,
      totalConnections,
      freeConnections,
      inUseConnections,
      queuedAcquires,
    };
  }
}

export const mysqlPoolMetrics = new MysqlPoolMetrics();

function safeLength(value: { length: number } | undefined): number {
  return value && Number.isSafeInteger(value.length) && value.length >= 0 ? value.length : 0;
}

export function mysqlErrorCode(error: unknown): string {
  const raw =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code.toUpperCase()
      : isMysql2PoolUnavailableError(error)
      ? 'POOL_NO_AVAILABLE'
      : 'UNKNOWN';
  return /^[A-Z0-9_]{1,64}$/.test(raw) ? raw : 'UNKNOWN';
}

export function isMysql2PoolUnavailableError(error: unknown): boolean {
  return error instanceof Error && /^No connections available\.?$/i.test(error.message.trim());
}
