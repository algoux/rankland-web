import type { DataSource, EntityManager, QueryRunner } from 'typeorm';
import TypeOrmClient from '@server/database/typeorm-client';
import { ContestEntity } from '@server/entities/contest.entity';
import { ContestEventStreamEntity } from '@server/entities/contest-event-stream.entity';
import type { IdGenerator } from '@server/services/id-generator.service';
import TypeOrmContestEventStore from '../contest-event-store.typeorm';
import { ContestEventReadDatabaseUnavailableError } from '../contest-event-read-db-deadline';

describe('TypeOrmContestEventStore bootstrap authority read', () => {
  it('keeps the legacy two-query manager path behind the A/B switch', async () => {
    const contestFind = vi.fn(async () => ({ id: '101', uk: 'Contest-A' }));
    const streamFind = vi.fn(async () => ({
      contestId: '101',
      lastEventId: 7,
      streamRevision: 2,
      producerId: null,
    }));
    const manager = {
      getRepository: vi.fn((entity) => {
        if (entity === ContestEntity) return { findOne: contestFind };
        if (entity === ContestEventStreamEntity) return { findOne: streamFind };
        throw new Error('unexpected repository');
      }),
    } as unknown as EntityManager;
    const createQueryRunner = vi.fn();
    const store = new TypeOrmContestEventStore(
      typeOrmClient({ manager, createQueryRunner } as unknown as DataSource),
      idGenerator,
      { queryTimeoutMs: 1_000, bootstrapAuthorityCoalescingEnabled: false },
    );

    await expect(store.getStreamState('Contest-A')).resolves.toMatchObject({
      contestId: '101',
      uk: 'Contest-A',
      lastEventId: 7,
      streamRevision: 2,
    });
    expect(contestFind).toHaveBeenCalledOnce();
    expect(streamFind).toHaveBeenCalledOnce();
    expect(createQueryRunner).not.toHaveBeenCalled();
  });

  it('uses one bounded joined query when bootstrap optimization is enabled', async () => {
    const builder = fluentBuilder({
      contestId: '101',
      uk: 'Contest-A',
      durationS: 18_000,
      frozenDurationS: null,
      lastEventId: 7,
      streamRevision: 2,
      producerId: null,
    });
    const manager = {
      getRepository: vi.fn(() => ({ createQueryBuilder: vi.fn(() => builder) })),
    } as unknown as EntityManager;
    const runner = {
      connect: vi.fn(async () => ({ release: vi.fn() })),
      release: vi.fn(async () => undefined),
      manager,
      isTransactionActive: false,
    } as unknown as QueryRunner;
    const createQueryRunner = vi.fn(() => runner);
    const store = new TypeOrmContestEventStore(
      typeOrmClient({ manager: {} as EntityManager, createQueryRunner } as unknown as DataSource),
      idGenerator,
      { queryTimeoutMs: 1_000, bootstrapAuthorityCoalescingEnabled: true },
    );

    await expect(store.getStreamState('Contest-A')).resolves.toMatchObject({
      contestId: '101',
      uk: 'Contest-A',
      lastEventId: 7,
      streamRevision: 2,
    });
    expect(createQueryRunner).toHaveBeenCalledOnce();
    expect(builder.getRawOne).toHaveBeenCalledOnce();
    expect(runner.release).toHaveBeenCalledOnce();
  });

  it('normalizes legacy manager pool failures into typed read unavailability', async () => {
    const manager = {
      getRepository: vi.fn(() => ({
        findOne: vi.fn(async () => {
          throw new Error('No connections available.');
        }),
      })),
    } as unknown as EntityManager;
    const store = new TypeOrmContestEventStore(
      typeOrmClient({ manager, createQueryRunner: vi.fn() } as unknown as DataSource),
      idGenerator,
      { queryTimeoutMs: 1_000, bootstrapAuthorityCoalescingEnabled: false },
    );

    await expect(store.getStreamState('Contest-A')).rejects.toBeInstanceOf(ContestEventReadDatabaseUnavailableError);
  });

  it('preflights exact range memory metadata before the payload query', async () => {
    const page = rangePageBuilder();
    const aggregate = fluentBuilder({
      rowCount: '2',
      payloadBytes: '1200',
      solutionSubmitTimeBytes: '38',
    }) as any;
    aggregate.from = vi.fn(() => aggregate);
    aggregate.setParameters = vi.fn(() => aggregate);
    const manager = {
      getRepository: vi.fn(() => ({ createQueryBuilder: vi.fn(() => page) })),
      createQueryBuilder: vi.fn(() => aggregate),
    } as unknown as EntityManager;
    const runner = {
      connect: vi.fn(async () => ({ release: vi.fn() })),
      release: vi.fn(async () => undefined),
      manager,
      isTransactionActive: false,
    } as unknown as QueryRunner;
    const store = new TypeOrmContestEventStore(
      typeOrmClient({ manager: {} as EntityManager, createQueryRunner: vi.fn(() => runner) } as unknown as DataSource),
      idGenerator,
      { queryTimeoutMs: 1_000 },
    );

    await expect(
      store.estimateEventRangeMemory({
        contestId: '101',
        streamRevision: 2,
        afterEventId: 5,
        throughEventId: 10,
        limit: 2,
      }),
    ).resolves.toEqual({ rowCount: 2, payloadBytes: 1200, solutionSubmitTimeBytes: 38 });
    expect(page.getQuery).toHaveBeenCalledOnce();
    expect(aggregate.from).toHaveBeenCalledWith('(SELECT range page)', 'event_page');
    expect(runner.release).toHaveBeenCalledOnce();
  });
});

const idGenerator = { nextId: vi.fn(() => '1') } as unknown as IdGenerator;

function typeOrmClient(dataSource: DataSource): TypeOrmClient {
  return { getDataSource: () => dataSource } as TypeOrmClient;
}

function fluentBuilder(row: Record<string, unknown>) {
  const builder: Record<string, any> = {};
  for (const method of ['innerJoin', 'select', 'addSelect', 'where', 'maxExecutionTime']) {
    builder[method] = vi.fn(() => builder);
  }
  builder.getRawOne = vi.fn(async () => row);
  return builder as {
    innerJoin: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    addSelect: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    maxExecutionTime: ReturnType<typeof vi.fn>;
    getRawOne: ReturnType<typeof vi.fn>;
  };
}

function rangePageBuilder() {
  const builder: Record<string, any> = {};
  for (const method of ['select', 'addSelect', 'where', 'andWhere', 'orderBy', 'limit']) {
    builder[method] = vi.fn(() => builder);
  }
  builder.getQuery = vi.fn(() => 'SELECT range page');
  builder.getParameters = vi.fn(() => ({ contestId: '101' }));
  return builder;
}
