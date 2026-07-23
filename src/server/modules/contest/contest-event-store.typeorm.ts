import { Inject, Provide } from 'bwcx-core';
import { EntityManager, In, QueryRunner } from 'typeorm';
import TypeOrmClient from '@server/database/typeorm-client';
import { ContestEntity } from '@server/entities/contest.entity';
import { ContestEventEntity } from '@server/entities/contest-event.entity';
import { ContestEventStreamEntity } from '@server/entities/contest-event-stream.entity';
import { rankland_live_contest_common } from '@common/proto/rankland_live_contest';
import { getFrozenStartNsFromSeconds } from './contest-time';
import {
  ContestEventInsertInput,
  ContestEventAuthorityState,
  ContestEventRangeMemoryEstimate,
  ContestEventRangeRead,
  ContestEventsSnapshotReadRequest,
  ContestEventStore,
  ContestEventsSnapshot,
  ContestEventTransaction,
  ContestReadableEvent,
  ContestStoredEvent,
  ContestStreamState,
} from './contest-event-store';
import LogicException from '@server/exceptions/logic.exception';
import { ErrCode } from '@common/enums/err-code.enum';
import IdGeneratorService, { IdGenerator } from '@server/services/id-generator.service';
import { contestEventReadMetrics } from './contest-event-read-metrics';
import ContestEventReadCacheConfig from '@server/configs/contest-event-read-cache/contest-event-read-cache.config';
import {
  ContestEventReadDatabaseDeadlineError,
  ContestEventReadDatabaseUnavailableError,
  runTypeOrmReadWithAcquisitionRetry,
} from './contest-event-read-db-deadline';

@Provide()
export default class TypeOrmContestEventStore implements ContestEventStore {
  public constructor(
    @Inject(TypeOrmClient) private readonly typeOrmClient: TypeOrmClient,
    @Inject(IdGeneratorService) private readonly idGenerator: IdGenerator,
    @Inject(ContestEventReadCacheConfig)
    private readonly readCacheConfig: Pick<ContestEventReadCacheConfig, 'queryTimeoutMs'> &
      Partial<
        Pick<
          ContestEventReadCacheConfig,
          | 'poolAcquireRetryAttempts'
          | 'poolAcquireRetryMinDelayMs'
          | 'poolAcquireRetryMaxDelayMs'
          | 'bootstrapAuthorityCoalescingEnabled'
        >
      > = {
      queryTimeoutMs: 1_000,
      poolAcquireRetryAttempts: 16,
      poolAcquireRetryMinDelayMs: 5,
      poolAcquireRetryMaxDelayMs: 50,
    },
  ) {}

  public async runInStreamTransaction<T>(
    uk: string,
    runner: (transaction: ContestEventTransaction) => Promise<T>,
  ): Promise<T> {
    return this.typeOrmClient.getDataSource().transaction(async (manager) => {
      const { contest, stream } = await this.findLockedStream(manager, uk);
      const transaction = new TypeOrmContestEventTransaction(manager, stream, contest.uk, this.idGenerator);
      return runner(transaction);
    });
  }

  public async releaseProducerLock(uk: string): Promise<ContestStreamState> {
    return this.typeOrmClient.getDataSource().transaction(async (manager) => {
      const { contest, stream } = await this.findLockedStream(manager, uk);
      stream.producerId = null;
      stream.producerLockedAt = null;
      await manager.getRepository(ContestEventStreamEntity).save(stream);
      return streamEntityToState(stream, contest.uk);
    });
  }

  public async getStreamState(uk: string): Promise<ContestStreamState> {
    if (this.readCacheConfig.bootstrapAuthorityCoalescingEnabled === false) {
      try {
        const { contest, stream } = await this.findStreamByUk(this.typeOrmClient.getDataSource().manager, uk);
        return streamEntityToState(stream, contest.uk);
      } catch (error) {
        this.rethrowReadFailure(error);
      }
    }
    const { stream } = await this.runBoundedRead((manager) => this.findSnapshotStateByUk(manager, uk));
    return stream;
  }

  public async getStreamStates(contestIds: readonly string[]): Promise<ContestStreamState[]> {
    const states = await this.readAuthorityByContestIds(contestIds);
    return states.map((state) => ({
      contestId: state.contestId,
      uk: state.canonicalUk,
      lastEventId: state.lastEventId,
      streamRevision: state.streamRevision,
    }));
  }

  public async readAuthorityByUk(uk: string): Promise<ContestEventAuthorityState> {
    contestEventReadMetrics.add('authorityByUkCalls');
    const { stream, durationS, frozenDurationS } = await this.runBoundedRead((manager) =>
      this.findSnapshotStateByUk(manager, uk),
    );
    contestEventReadMetrics.add('authorityByUkRows');
    return authorityState(stream, durationS, frozenDurationS);
  }

  public async readAuthorityByContestIds(contestIds: readonly string[]): Promise<ContestEventAuthorityState[]> {
    if (contestIds.length === 0) {
      return [];
    }
    contestEventReadMetrics.add('authorityBatchCalls');
    const rows = await this.runBoundedRead((manager) =>
      manager
        .getRepository(ContestEventStreamEntity)
        .createQueryBuilder('stream')
        .innerJoin(ContestEntity, 'contest', 'contest.id = stream.contestId')
        .select('stream.contestId', 'contestId')
        .addSelect('contest.uk', 'canonicalUk')
        .addSelect('contest.durationS', 'durationS')
        .addSelect('contest.frozenDurationS', 'frozenDurationS')
        .addSelect('stream.lastEventId', 'lastEventId')
        .addSelect('stream.streamRevision', 'streamRevision')
        .where('stream.contestId IN (:...contestIds)', { contestIds: [...contestIds] })
        .andWhere('contest.deletedAt IS NULL')
        .maxExecutionTime(this.readCacheConfig.queryTimeoutMs)
        .getRawMany<{
          contestId: string | number;
          canonicalUk: string;
          durationS: string | number;
          frozenDurationS?: string | number | null;
          lastEventId: string | number;
          streamRevision: string | number;
        }>(),
    );
    contestEventReadMetrics.add('authorityBatchRows', rows.length);
    return rows.map((row) =>
      authorityState(
        {
          contestId: String(row.contestId),
          uk: row.canonicalUk,
          lastEventId: Number(row.lastEventId),
          streamRevision: Number(row.streamRevision),
        },
        Number(row.durationS),
        row.frozenDurationS === undefined || row.frozenDurationS === null ? null : Number(row.frozenDurationS),
      ),
    );
  }

  public async readEventRange(request: ContestEventRangeRead): Promise<ContestReadableEvent[]> {
    if (request.afterEventId >= request.throughEventId || request.limit < 1) {
      return [];
    }
    contestEventReadMetrics.add('eventRangeCalls');
    const events = await this.runBoundedRead((manager) =>
      manager
        .getRepository(ContestEventEntity)
        .createQueryBuilder('event')
        .select([
          'event.contestId',
          'event.eventId',
          'event.streamRevision',
          'event.type',
          'event.solutionId',
          'event.solutionSubmitTimeNs',
          'event.payloadBytes',
        ])
        .where('event.contestId = :contestId', { contestId: request.contestId })
        .andWhere('event.streamRevision = :streamRevision', { streamRevision: request.streamRevision })
        .andWhere('event.eventId > :afterEventId', { afterEventId: request.afterEventId })
        .andWhere('event.eventId <= :throughEventId', { throughEventId: request.throughEventId })
        .orderBy('event.eventId', 'ASC')
        .limit(Math.max(1, Math.trunc(request.limit)))
        .maxExecutionTime(this.readCacheConfig.queryTimeoutMs)
        .getMany(),
    );
    contestEventReadMetrics.add('eventRangeRows', events.length);
    return events.map(eventEntityToReadableEvent);
  }

  public async estimateEventRangeMemory(request: ContestEventRangeRead): Promise<ContestEventRangeMemoryEstimate> {
    if (request.afterEventId >= request.throughEventId || request.limit < 1) {
      return { rowCount: 0, payloadBytes: 0, solutionSubmitTimeBytes: 0 };
    }
    return this.runBoundedRead(async (manager) => {
      const page = manager
        .getRepository(ContestEventEntity)
        .createQueryBuilder('event')
        .select('event.payloadBytes', 'payloadBytes')
        .addSelect('event.solutionSubmitTimeNs', 'solutionSubmitTimeNs')
        .where('event.contestId = :contestId', { contestId: request.contestId })
        .andWhere('event.streamRevision = :streamRevision', { streamRevision: request.streamRevision })
        .andWhere('event.eventId > :afterEventId', { afterEventId: request.afterEventId })
        .andWhere('event.eventId <= :throughEventId', { throughEventId: request.throughEventId })
        .orderBy('event.eventId', 'ASC')
        .limit(Math.max(1, Math.trunc(request.limit)));
      const row = await manager
        .createQueryBuilder()
        .select('COUNT(*)', 'rowCount')
        .addSelect('COALESCE(SUM(OCTET_LENGTH(event_page.payloadBytes)), 0)', 'payloadBytes')
        .addSelect('COALESCE(SUM(OCTET_LENGTH(event_page.solutionSubmitTimeNs)), 0)', 'solutionSubmitTimeBytes')
        .from(`(${page.getQuery()})`, 'event_page')
        .setParameters(page.getParameters())
        .maxExecutionTime(this.readCacheConfig.queryTimeoutMs)
        .getRawOne<{
          rowCount: string | number;
          payloadBytes: string | number;
          solutionSubmitTimeBytes: string | number;
        }>();
      return {
        rowCount: parseNonNegativeSafeInteger(row?.rowCount, 'event range row count'),
        payloadBytes: parseNonNegativeSafeInteger(row?.payloadBytes, 'event range payload bytes'),
        solutionSubmitTimeBytes: parseNonNegativeSafeInteger(
          row?.solutionSubmitTimeBytes,
          'event range submit-time bytes',
        ),
      };
    });
  }

  public async readEventsSnapshot(request: ContestEventsSnapshotReadRequest): Promise<ContestEventsSnapshot> {
    contestEventReadMetrics.add('eventsReadTransactionStarted');
    contestEventReadMetrics.add('legacySnapshotCalls');
    try {
      const snapshot = await this.runBoundedRead(async (manager) => {
        const { stream, durationS, frozenDurationS } = await this.findSnapshotStateByUk(manager, request.uk);
        const snapshotLastEventId =
          request.throughEventId === undefined
            ? stream.lastEventId
            : Math.min(stream.lastEventId, Math.max(0, Math.trunc(request.throughEventId)));
        const shouldReadEvents =
          request.requestStreamRevision === stream.streamRevision && request.afterEventId <= snapshotLastEventId;
        const events = shouldReadEvents
          ? await manager
              .getRepository(ContestEventEntity)
              .createQueryBuilder('event')
              .select([
                'event.contestId',
                'event.eventId',
                'event.streamRevision',
                'event.type',
                'event.solutionId',
                'event.solutionSubmitTimeNs',
                'event.payloadBytes',
              ])
              .where('event.contestId = :contestId', { contestId: stream.contestId })
              .andWhere('event.streamRevision = :streamRevision', { streamRevision: stream.streamRevision })
              .andWhere('event.eventId > :afterEventId', { afterEventId: request.afterEventId })
              .andWhere('event.eventId <= :snapshotLastEventId', { snapshotLastEventId })
              .orderBy('event.eventId', 'ASC')
              .limit(request.limit)
              .maxExecutionTime(this.readCacheConfig.queryTimeoutMs)
              .getMany()
          : [];
        const settledRows =
          shouldReadEvents && request.compactProgress
            ? await manager
                .getRepository(ContestEventEntity)
                .createQueryBuilder('event')
                .select('event.solutionId', 'solutionId')
                .addSelect('MAX(event.eventId)', 'eventId')
                .where('event.contestId = :contestId', { contestId: stream.contestId })
                .andWhere('event.streamRevision = :streamRevision', { streamRevision: stream.streamRevision })
                .andWhere('event.eventId > :afterEventId', { afterEventId: request.afterEventId })
                .andWhere('event.eventId <= :snapshotLastEventId', { snapshotLastEventId })
                .andWhere('event.solutionId IS NOT NULL')
                .andWhere('event.type IN (:...types)', {
                  types: [
                    rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE,
                    rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE,
                  ],
                })
                .groupBy('event.solutionId')
                .maxExecutionTime(this.readCacheConfig.queryTimeoutMs)
                .getRawMany<{ solutionId: string | number; eventId: string | number }>()
            : [];
        return {
          stream: { ...stream, lastEventId: snapshotLastEventId },
          events: events.map(eventEntityToReadableEvent),
          settledEventIdsBySolutionId: new Map(
            settledRows.map((row) => [Number(row.solutionId), Number(row.eventId)] as [number, number]),
          ),
          frozenStartNs: getFrozenStartNsFromSeconds(durationS, frozenDurationS),
        };
      }, 'REPEATABLE READ');
      contestEventReadMetrics.add('eventsReadTransactionCommitted');
      contestEventReadMetrics.add('legacySnapshotRows', snapshot.events.length);
      return snapshot;
    } catch (error) {
      contestEventReadMetrics.add('eventsReadTransactionRolledBack');
      throw error;
    }
  }

  private async findSnapshotStateByUk(
    manager: EntityManager,
    uk: string,
  ): Promise<{
    stream: ContestStreamState;
    durationS: number;
    frozenDurationS?: number | null;
  }> {
    const row = await manager
      .getRepository(ContestEntity)
      .createQueryBuilder('contest')
      .innerJoin(ContestEventStreamEntity, 'stream', 'stream.contestId = contest.id')
      .select('contest.id', 'contestId')
      .addSelect('contest.uk', 'uk')
      .addSelect('contest.durationS', 'durationS')
      .addSelect('contest.frozenDurationS', 'frozenDurationS')
      .addSelect('stream.lastEventId', 'lastEventId')
      .addSelect('stream.streamRevision', 'streamRevision')
      .addSelect('stream.producerId', 'producerId')
      .where('contest.uk = :uk', { uk })
      .maxExecutionTime(this.readCacheConfig.queryTimeoutMs)
      .getRawOne<{
        contestId: string | number;
        uk: string;
        durationS: string | number;
        frozenDurationS?: string | number | null;
        lastEventId: string | number;
        streamRevision: string | number;
        producerId?: string | null;
      }>();
    if (!row) {
      throw new LogicException(ErrCode.ContestNotFound, `contest ${uk} not found`);
    }
    return {
      stream: {
        contestId: String(row.contestId),
        uk: row.uk,
        lastEventId: Number(row.lastEventId),
        streamRevision: Number(row.streamRevision),
        producerId: row.producerId,
      },
      durationS: Number(row.durationS),
      frozenDurationS:
        row.frozenDurationS === undefined || row.frozenDurationS === null ? null : Number(row.frozenDurationS),
    };
  }

  private async runBoundedRead<T>(
    read: (manager: EntityManager) => Promise<T>,
    isolationLevel?: NonNullable<Parameters<QueryRunner['startTransaction']>[0]>,
  ): Promise<T> {
    try {
      return await runTypeOrmReadWithAcquisitionRetry(
        () => this.typeOrmClient.getDataSource().createQueryRunner(),
        this.readCacheConfig.queryTimeoutMs,
        read,
        isolationLevel,
        {
          maximumAttempts: this.readCacheConfig.poolAcquireRetryAttempts ?? 16,
          minimumDelayMs: this.readCacheConfig.poolAcquireRetryMinDelayMs ?? 5,
          maximumDelayMs: this.readCacheConfig.poolAcquireRetryMaxDelayMs ?? 50,
        },
      );
    } catch (error) {
      this.rethrowReadFailure(error);
    }
  }

  private rethrowReadFailure(error: unknown): never {
    if (error instanceof ContestEventReadDatabaseDeadlineError) {
      contestEventReadMetrics.add('databaseReadDeadlines');
      contestEventReadMetrics.add(deadlinePhaseCounter(error.phase));
    }
    if (error instanceof LogicException) {
      throw error;
    }
    contestEventReadMetrics.add('databaseReadUnavailable');
    if (error instanceof ContestEventReadDatabaseUnavailableError) {
      throw error;
    }
    throw new ContestEventReadDatabaseUnavailableError('contest event database read failed', error);
  }

  private async findLockedStream(
    manager: EntityManager,
    uk: string,
  ): Promise<{ contest: ContestEntity; stream: ContestEventStreamEntity }> {
    const { contest } = await this.findContestByUk(manager, uk, true);
    const stream = await manager.getRepository(ContestEventStreamEntity).findOne({
      where: { contestId: contest.id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!stream) {
      throw new LogicException(ErrCode.ContestNotFound, `contest ${uk} not found`);
    }
    return { contest, stream };
  }

  private async findStreamByUk(
    manager: EntityManager,
    uk: string,
  ): Promise<{ contest: ContestEntity; stream: ContestEventStreamEntity }> {
    const { contest } = await this.findContestByUk(manager, uk);
    const stream = await manager.getRepository(ContestEventStreamEntity).findOne({ where: { contestId: contest.id } });
    if (!stream) {
      throw new LogicException(ErrCode.ContestNotFound, `contest ${uk} not found`);
    }
    return { contest, stream };
  }

  private async findContestByUk(manager: EntityManager, uk: string, lock = false): Promise<{ contest: ContestEntity }> {
    const contest = await manager.getRepository(ContestEntity).findOne({
      where: { uk },
      ...(lock ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
    if (!contest) {
      throw new LogicException(ErrCode.ContestNotFound, `contest ${uk} not found`);
    }
    return { contest };
  }
}

function deadlinePhaseCounter(
  phase: ContestEventReadDatabaseDeadlineError['phase'],
):
  | 'databaseReadDeadlineAcquire'
  | 'databaseReadDeadlineTransaction'
  | 'databaseReadDeadlineQuery'
  | 'databaseReadDeadlineRelease' {
  if (phase === 'acquire') return 'databaseReadDeadlineAcquire';
  if (phase === 'query') return 'databaseReadDeadlineQuery';
  if (phase === 'release') return 'databaseReadDeadlineRelease';
  return 'databaseReadDeadlineTransaction';
}

class TypeOrmContestEventTransaction implements ContestEventTransaction {
  public readonly stream: ContestStreamState;

  public constructor(
    private readonly manager: EntityManager,
    private readonly streamEntity: ContestEventStreamEntity,
    uk: string,
    private readonly idGenerator: IdGenerator,
  ) {
    this.stream = streamEntityToState(streamEntity, uk);
  }

  public async findEvents(eventIds: number[]): Promise<ContestStoredEvent[]> {
    if (eventIds.length === 0) {
      return [];
    }
    const entities = await this.manager.getRepository(ContestEventEntity).find({
      where: {
        contestId: this.stream.contestId,
        streamRevision: this.stream.streamRevision,
        eventId: In(eventIds),
      },
    });
    return entities.map(eventEntityToStoredEvent);
  }

  public async findNewSolutionSubmitTimes(solutionIds: number[]): Promise<Map<number, string>> {
    if (solutionIds.length === 0) {
      return new Map();
    }
    const entities = await this.manager.getRepository(ContestEventEntity).find({
      where: {
        contestId: this.stream.contestId,
        streamRevision: this.stream.streamRevision,
        type: rankland_live_contest_common.EventType.NEW_SOLUTION,
        solutionId: In(solutionIds),
      },
    });
    const result = new Map<number, string>();
    for (const entity of entities) {
      if (entity.solutionId === undefined || entity.solutionId === null) {
        continue;
      }
      const submitTimeNs = entity.solutionSubmitTimeNs || entity.timeNs;
      if (submitTimeNs) {
        result.set(entity.solutionId, submitTimeNs);
      }
    }
    return result;
  }

  public async insertEvents(inputs: ContestEventInsertInput[]): Promise<void> {
    if (inputs.length === 0) {
      return;
    }
    const entities = this.manager.getRepository(ContestEventEntity).create(
      inputs.map((input) => ({
        ...input,
        id: this.idGenerator.nextId(),
        contestId: this.stream.contestId,
        streamRevision: this.stream.streamRevision,
        payloadBytes: Buffer.from(input.payloadBytes),
      })),
    );
    await this.manager.getRepository(ContestEventEntity).insert(entities);
  }

  public async setProducerLock(producerId: string): Promise<void> {
    this.stream.producerId = producerId;
    this.streamEntity.producerId = producerId;
    this.streamEntity.producerLockedAt = new Date();
    await this.manager.getRepository(ContestEventStreamEntity).save(this.streamEntity);
  }

  public async advanceLastEventId(lastEventId: number): Promise<void> {
    this.stream.lastEventId = lastEventId;
    this.streamEntity.lastEventId = lastEventId;
    await this.manager.getRepository(ContestEventStreamEntity).save(this.streamEntity);
  }
}

function streamEntityToState(entity: ContestEventStreamEntity, uk: string): ContestStreamState {
  return {
    contestId: entity.contestId,
    uk,
    lastEventId: entity.lastEventId,
    streamRevision: entity.streamRevision,
    producerId: entity.producerId,
  };
}

function eventEntityToStoredEvent(entity: ContestEventEntity): ContestStoredEvent {
  return {
    contestId: entity.contestId,
    eventId: entity.eventId,
    streamRevision: entity.streamRevision,
    type: entity.type,
    producerId: entity.producerId,
    solutionId: entity.solutionId,
    userId: entity.userId,
    problemAlias: entity.problemAlias,
    percentageProgress: entity.percentageProgress,
    previousResult: entity.previousResult,
    result: entity.result,
    timeNs: entity.timeNs,
    solutionSubmitTimeNs: entity.solutionSubmitTimeNs,
    payloadHash: entity.payloadHash,
    payloadBytes: Buffer.from(entity.payloadBytes),
  };
}

function eventEntityToReadableEvent(entity: ContestEventEntity): ContestReadableEvent {
  return {
    contestId: entity.contestId,
    eventId: entity.eventId,
    streamRevision: entity.streamRevision,
    type: entity.type,
    solutionId: entity.solutionId,
    solutionSubmitTimeNs: entity.solutionSubmitTimeNs,
    payloadBytes: Buffer.from(entity.payloadBytes),
  };
}

function parseNonNegativeSafeInteger(value: unknown, name: string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`${name} is invalid`);
  }
  return parsed;
}

function authorityState(
  stream: ContestStreamState,
  durationS: number,
  frozenDurationS?: number | null,
): ContestEventAuthorityState {
  return {
    contestId: stream.contestId,
    canonicalUk: stream.uk,
    streamRevision: stream.streamRevision,
    lastEventId: stream.lastEventId,
    frozenStartNs: getFrozenStartNsFromSeconds(durationS, frozenDurationS),
    visibilityFingerprint: `duration=${durationS};frozen=${frozenDurationS ?? 'null'}`,
  };
}
