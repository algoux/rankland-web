import { Inject, Provide } from 'bwcx-core';
import { EntityManager, In, MoreThan } from 'typeorm';
import TypeOrmClient from '@server/database/typeorm-client';
import { ContestEntity } from '@server/entities/contest.entity';
import { ContestEventEntity } from '@server/entities/contest-event.entity';
import { ContestEventStreamEntity } from '@server/entities/contest-event-stream.entity';
import { rankland_live_contest_common } from '@common/proto/rankland_live_contest';
import { ContestEventError, ContestEventErrorCode } from './contest-event-errors';
import { getFrozenStartNs } from './contest-time';
import {
  ContestEventInsertInput,
  ContestEventStore,
  ContestEventsSnapshot,
  ContestEventTransaction,
  ContestStoredEvent,
  ContestStreamState,
} from './contest-event-store';

@Provide()
export default class TypeOrmContestEventStore implements ContestEventStore {
  public constructor(@Inject(TypeOrmClient) private readonly typeOrmClient: TypeOrmClient) {}

  public async runInStreamTransaction<T>(
    uk: string,
    runner: (transaction: ContestEventTransaction) => Promise<T>,
  ): Promise<T> {
    return this.typeOrmClient.getDataSource().transaction(async (manager) => {
      const stream = await this.findLockedStream(manager, uk);
      const transaction = new TypeOrmContestEventTransaction(manager, stream, uk);
      return runner(transaction);
    });
  }

  public async releaseProducerLock(uk: string): Promise<ContestStreamState> {
    return this.typeOrmClient.getDataSource().transaction(async (manager) => {
      const stream = await this.findLockedStream(manager, uk);
      stream.producerId = null;
      stream.producerLockedAt = null;
      await manager.getRepository(ContestEventStreamEntity).save(stream);
      return streamEntityToState(stream, uk);
    });
  }

  public async getStreamState(uk: string): Promise<ContestStreamState> {
    const { stream } = await this.findStreamByUk(this.typeOrmClient.getDataSource().manager, uk);
    return streamEntityToState(stream, uk);
  }

  public async readEventsSnapshot(uk: string, afterEventId: number, limit: number): Promise<ContestEventsSnapshot> {
    return this.typeOrmClient.getDataSource().transaction('REPEATABLE READ', async (manager) => {
      const { contest, stream } = await this.findStreamByUk(manager, uk);
      const events = await manager.getRepository(ContestEventEntity).find({
        where: {
          contestId: stream.contestId,
          streamRevision: stream.streamRevision,
          eventId: MoreThan(afterEventId),
        },
        order: {
          eventId: 'ASC',
        },
        take: limit,
      });
      const settledRows = await manager
        .getRepository(ContestEventEntity)
        .createQueryBuilder('event')
        .select('event.solutionId', 'solutionId')
        .addSelect('MAX(event.eventId)', 'eventId')
        .where('event.contestId = :contestId', { contestId: stream.contestId })
        .andWhere('event.streamRevision = :streamRevision', { streamRevision: stream.streamRevision })
        .andWhere('event.eventId > :afterEventId', { afterEventId })
        .andWhere('event.solutionId IS NOT NULL')
        .andWhere('event.type IN (:...types)', {
          types: [
            rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE,
            rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE,
          ],
        })
        .groupBy('event.solutionId')
        .getRawMany<{ solutionId: string | number; eventId: string | number }>();
      return {
        stream: streamEntityToState(stream, uk),
        events: events.map(eventEntityToStoredEvent),
        settledEventIdsBySolutionId: new Map(
          settledRows.map((row) => [Number(row.solutionId), Number(row.eventId)] as [number, number]),
        ),
        frozenStartNs: getFrozenStartNs(contest.contest),
      };
    });
  }

  private async findLockedStream(manager: EntityManager, uk: string): Promise<ContestEventStreamEntity> {
    const { contest } = await this.findContestByUk(manager, uk);
    const stream = await manager.getRepository(ContestEventStreamEntity).findOne({
      where: { contestId: contest.id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!stream) {
      throw new ContestEventError(ContestEventErrorCode.ContestNotFound, `contest ${uk} not found`);
    }
    return stream;
  }

  private async findStreamByUk(manager: EntityManager, uk: string): Promise<{ contest: ContestEntity; stream: ContestEventStreamEntity }> {
    const { contest } = await this.findContestByUk(manager, uk);
    const stream = await manager.getRepository(ContestEventStreamEntity).findOne({ where: { contestId: contest.id } });
    if (!stream) {
      throw new ContestEventError(ContestEventErrorCode.ContestNotFound, `contest ${uk} not found`);
    }
    return { contest, stream };
  }

  private async findContestByUk(manager: EntityManager, uk: string): Promise<{ contest: ContestEntity }> {
    const contest = await manager.getRepository(ContestEntity).findOne({ where: { uk } });
    if (!contest) {
      throw new ContestEventError(ContestEventErrorCode.ContestNotFound, `contest ${uk} not found`);
    }
    return { contest };
  }
}

class TypeOrmContestEventTransaction implements ContestEventTransaction {
  public readonly stream: ContestStreamState;

  public constructor(
    private readonly manager: EntityManager,
    private readonly streamEntity: ContestEventStreamEntity,
    uk: string,
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
    payloadHash: entity.payloadHash,
    payloadBytes: Buffer.from(entity.payloadBytes),
    producerId: entity.producerId,
    solutionId: entity.solutionId,
    userId: entity.userId,
    problemAlias: entity.problemAlias,
    percentageProgress: entity.percentageProgress,
    previousResult: entity.previousResult,
    result: entity.result,
    timeNs: entity.timeNs,
    solutionSubmitTimeNs: entity.solutionSubmitTimeNs,
  };
}
