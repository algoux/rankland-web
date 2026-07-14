import { Inject, Provide } from 'bwcx-core';
import os from 'os';
import type { QueryRunner, Repository } from 'typeorm';

import IdGeneratorConfig from '@server/configs/id-generator/id-generator.config';
import TypeOrmClient from '@server/database/typeorm-client';
import { IdWorkerRegistryEntity } from '@server/entities/id-worker-registry.entity';
import { SnowflakeIdGenerator } from '@server/lib/snowflake-id';

const WORKER_SLOT_COUNT = 1024;
const RESERVATION_WINDOW_MS = 10_000;
const RESERVATION_RENEW_INTERVAL_MS = 2_000;
const LOCK_NAME_PREFIX = 'rankland:snowflake-worker:';

type ServiceState = 'uninitialized' | 'ready' | 'lost' | 'closed';

export interface IdGenerator {
  nextId: () => string;
}

/**
 * Owns one Snowflake worker slot for the lifetime of this process.
 *
 * A MySQL named lock prevents concurrent owners. Persisted timestamp windows
 * fence a replacement owner from the final window reserved by a disconnected
 * process, so a recycled worker id cannot replay the same timestamp/sequence.
 */
@Provide()
export default class IdGeneratorService implements IdGenerator {
  private state: ServiceState = 'uninitialized';
  private generator?: SnowflakeIdGenerator;
  private queryRunner?: QueryRunner;
  private registryRepository?: Repository<IdWorkerRegistryEntity>;
  private registrationId?: string;
  private lockName?: string;
  private logicalClockOffsetMs = 0;
  private reservedUntilMs?: number;
  private renewalTimer?: NodeJS.Timeout;
  private renewalPromise?: Promise<void>;
  private requestedReservedUntilMs?: number;
  private rawConnection?: {
    on?: (event: string, listener: () => void) => void;
    off?: (event: string, listener: () => void) => void;
  };

  public constructor(
    @Inject(TypeOrmClient) private readonly typeOrmClient: TypeOrmClient,
    @Inject(IdGeneratorConfig) private readonly config: IdGeneratorConfig,
  ) {}

  public async init(): Promise<void> {
    if (this.state === 'ready') {
      return;
    }
    if (this.state !== 'uninitialized') {
      throw new Error(`ID generator cannot initialize from state ${this.state}`);
    }

    if (this.config.workerIdOverride !== undefined) {
      this.generator = new SnowflakeIdGenerator({ workerId: this.config.workerIdOverride });
      this.state = 'ready';
      return;
    }

    const queryRunner = this.typeOrmClient.getDataSource().createQueryRunner();
    this.queryRunner = queryRunner;

    try {
      this.rawConnection = await queryRunner.connect();
      this.rawConnection?.on?.('error', this.handleConnectionLoss);
      this.rawConnection?.on?.('end', this.handleConnectionLoss);

      const repository = queryRunner.manager.getRepository(IdWorkerRegistryEntity);
      this.registryRepository = repository;
      const registration = repository.create({
        workerId: null,
        reservedUntilMs: null,
        host: os.hostname(),
        pid: process.pid,
      });
      await repository.save(registration);
      this.registrationId = registration.id;

      const workerId = await this.claimWorkerSlot(registration.id);
      const previousReservedUntilMs = await this.readPreviousReservation(workerId);
      const physicalNowMs = Date.now();
      const firstLogicalTimestampMs = Math.max(physicalNowMs, (previousReservedUntilMs ?? -1) + 1);
      this.logicalClockOffsetMs = firstLogicalTimestampMs - physicalNowMs;
      this.reservedUntilMs = firstLogicalTimestampMs + RESERVATION_WINDOW_MS;

      const registrationUpdate = await repository.update(
        { id: registration.id },
        {
          workerId,
          reservedUntilMs: String(this.reservedUntilMs),
        },
      );
      if (registrationUpdate.affected !== 1) {
        throw new Error('Failed to persist the initial Snowflake timestamp reservation');
      }

      this.generator = new SnowflakeIdGenerator({
        workerId,
        now: this.readReservedLogicalTime,
      });
      this.state = 'ready';
      this.renewalTimer = setInterval(this.requestReservationRenewal, RESERVATION_RENEW_INTERVAL_MS);
      this.renewalTimer.unref?.();
    } catch (error) {
      this.state = 'lost';
      await this.releaseQueryRunner();
      throw error;
    }
  }

  public nextId(): string {
    if (this.state === 'uninitialized') {
      throw new Error('ID generator is not initialized');
    }
    if (this.state !== 'ready' || !this.generator) {
      throw new Error('ID generator worker ownership is not available');
    }
    return this.generator.nextId();
  }

  public async dispose(): Promise<void> {
    if (this.state === 'closed') {
      return;
    }
    this.state = 'closed';
    this.clearRenewalTimer();
    await this.renewalPromise?.catch(() => undefined);
    await this.releaseQueryRunner();
  }

  private readonly readReservedLogicalTime = (): number => {
    if (this.state !== 'ready') {
      throw new Error('ID generator worker ownership is not available');
    }

    const timestampMs = Date.now() + this.logicalClockOffsetMs;
    if (this.reservedUntilMs !== undefined && timestampMs > this.reservedUntilMs) {
      // Never emit beyond the durable fence. The current write retries after
      // this single-flight renewal has persisted a window covering the jump.
      this.requestReservationRenewal();
      throw new Error('ID generator timestamp reservation expired; renewal requested');
    }
    return timestampMs;
  };

  private readonly requestReservationRenewal = (): void => {
    if (this.state !== 'ready') {
      return;
    }
    this.requestedReservedUntilMs = Math.max(
      this.requestedReservedUntilMs ?? 0,
      Date.now() + this.logicalClockOffsetMs + RESERVATION_WINDOW_MS,
    );
    this.getOrStartReservationRenewal().catch(() => undefined);
  };

  private getOrStartReservationRenewal(): Promise<void> {
    this.renewalPromise ??= this.runReservationRenewal();
    return this.renewalPromise;
  }

  private async runReservationRenewal(): Promise<void> {
    try {
      while (this.state === 'ready' && this.requestedReservedUntilMs !== undefined) {
        const requestedReservedUntilMs = this.requestedReservedUntilMs;
        this.requestedReservedUntilMs = undefined;
        await this.renewReservation(requestedReservedUntilMs);
      }
    } catch (error) {
      this.markOwnershipLost(error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      this.renewalPromise = undefined;
      if (this.state !== 'ready') {
        this.requestedReservedUntilMs = undefined;
      }
    }
  }

  private async claimWorkerSlot(registrationId: string): Promise<number> {
    const firstCandidate = Number(BigInt(registrationId) % BigInt(WORKER_SLOT_COUNT));
    for (let offset = 0; offset < WORKER_SLOT_COUNT; offset += 1) {
      const workerId = (firstCandidate + offset) % WORKER_SLOT_COUNT;
      const lockName = `${LOCK_NAME_PREFIX}${workerId}`;
      const rows = await this.queryRunner!.query('SELECT GET_LOCK(?, 0) AS `acquired`', [lockName]);
      if (Number(rows[0]?.acquired) === 1) {
        this.lockName = lockName;
        return workerId;
      }
    }
    throw new Error('No Snowflake worker slots are available');
  }

  private async readPreviousReservation(workerId: number): Promise<number | undefined> {
    const rows = await this.queryRunner!.query(
      'SELECT MAX(`reserved_until_ms`) AS `reservedUntilMs` FROM `id_worker_registry` WHERE `worker_id` = ?',
      [workerId],
    );
    const rawValue = rows[0]?.reservedUntilMs;
    if (rawValue === null || rawValue === undefined) {
      return undefined;
    }

    const value = Number(rawValue);
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`Invalid Snowflake timestamp reservation: ${String(rawValue)}`);
    }
    return value;
  }

  private async renewReservation(requestedReservedUntilMs: number): Promise<void> {
    if (
      this.state !== 'ready' ||
      !this.queryRunner ||
      !this.registryRepository ||
      !this.registrationId ||
      !this.lockName
    ) {
      throw new Error('Snowflake worker ownership resources are not available');
    }

    const rows = await this.queryRunner.query(
      'SELECT IS_USED_LOCK(?) AS `ownerConnectionId`, CONNECTION_ID() AS `connectionId`',
      [this.lockName],
    );
    const ownerConnectionId = rows[0]?.ownerConnectionId;
    const connectionId = rows[0]?.connectionId;
    if (ownerConnectionId === null || String(ownerConnectionId) !== String(connectionId)) {
      throw new Error('MySQL named lock is no longer owned by this connection');
    }

    const nextReservedUntilMs = Math.max(
      this.reservedUntilMs ?? 0,
      requestedReservedUntilMs,
      Date.now() + this.logicalClockOffsetMs + RESERVATION_WINDOW_MS,
    );
    const reservationUpdate = await this.registryRepository.update(
      { id: this.registrationId },
      { reservedUntilMs: String(nextReservedUntilMs) },
    );
    if (reservationUpdate.affected !== 1) {
      throw new Error('Snowflake worker registration no longer exists');
    }
    this.reservedUntilMs = nextReservedUntilMs;
  }

  private readonly handleConnectionLoss = (): void => {
    this.markOwnershipLost('MySQL worker-lock connection closed');
  };

  private markOwnershipLost(reason: string): void {
    if (this.state !== 'ready') {
      return;
    }
    this.state = 'lost';
    this.generator = undefined;
    this.clearRenewalTimer();
    console.error(`[Snowflake] worker ownership lost: ${reason}`);
  }

  private clearRenewalTimer(): void {
    if (this.renewalTimer) {
      clearInterval(this.renewalTimer);
      this.renewalTimer = undefined;
    }
  }

  private async releaseQueryRunner(): Promise<void> {
    const queryRunner = this.queryRunner;
    if (!queryRunner) {
      return;
    }

    this.rawConnection?.off?.('error', this.handleConnectionLoss);
    this.rawConnection?.off?.('end', this.handleConnectionLoss);
    try {
      if (this.lockName) {
        await queryRunner.query('SELECT RELEASE_LOCK(?) AS `released`', [this.lockName]);
      }
    } catch (error) {
      console.warn('[Snowflake] failed to release worker lock:', error);
    } finally {
      await queryRunner.release().catch((error) => {
        console.warn('[Snowflake] failed to release worker-lock connection:', error);
      });
      this.queryRunner = undefined;
      this.registryRepository = undefined;
      this.rawConnection = undefined;
      this.lockName = undefined;
    }
  }
}
