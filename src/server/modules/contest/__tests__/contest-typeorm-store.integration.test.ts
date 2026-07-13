import { DataSource } from 'typeorm';
import MysqlConfig from '@server/configs/mysql/mysql.config';
import { getMysqlDataSourceOptions } from '@server/database/typeorm-data-source';
import { ContestEntity } from '@server/entities/contest.entity';
import { ContestEventStreamEntity } from '@server/entities/contest-event-stream.entity';
import TypeOrmClient from '@server/database/typeorm-client';
import MiscUtils from '@server/utils/misc.util';
import ContestService from '../contest.service';
import TypeOrmContestEventStore from '../contest-event-store.typeorm';
import ContestEventStreamService from '../contest-event-stream.service';
import {
  rankland_live_contest_common,
} from '@common/proto/rankland_live_contest';
import { parseProducerBatchJson } from '../contest-event-codec';
import { ContestClientEventBO } from '../contest-event-bo';

const runMysqlTests = process.env.RUN_MYSQL_TESTS === 'true';

describe.runIf(runMysqlTests)('contest TypeORM event store', () => {
  const uk = `vitest-${Date.now()}`;
  const createdUks = new Set<string>([uk]);
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      ...getMysqlDataSourceOptions(new MysqlConfig()),
      migrationsRun: false,
      migrations: [],
    });
    await dataSource.initialize();
    const contest = await dataSource.getRepository(ContestEntity).save(
      dataSource.getRepository(ContestEntity).create({
        uk,
        name: uk,
        contest: { title: uk, startAt: '2026-01-01T00:00:00Z', duration: [5, 'h'] } as any,
        problems: [],
        markers: [],
        series: [],
        sorter: null,
        contributors: null,
      }),
    );
    await dataSource.getRepository(ContestEventStreamEntity).save(
      dataSource.getRepository(ContestEventStreamEntity).create({
        contestId: contest.id,
        lastEventId: 0,
        streamRevision: 1,
      }),
    );
  });

  afterAll(async () => {
    if (!dataSource?.isInitialized) {
      return;
    }
    for (const itemUk of createdUks) {
      const contest = await dataSource.getRepository(ContestEntity).findOne({ where: { uk: itemUk } });
      const stream = contest
        ? await dataSource.getRepository(ContestEventStreamEntity).findOne({ where: { contestId: contest.id } })
        : null;
      if (contest) {
        await dataSource.query('DELETE FROM contest_event WHERE contest_id = ?', [contest.id]);
        await dataSource.query('DELETE FROM contest_user WHERE contest_id = ?', [contest.id]);
        await dataSource.query('DELETE FROM contest_event_stream WHERE contest_id = ?', [contest.id]);
        await dataSource.query('DELETE FROM contest WHERE id = ?', [contest.id]);
      } else if (stream) {
        await dataSource.query('DELETE FROM contest_event_stream WHERE contest_id = ?', [stream.contestId]);
      }
    }
    await dataSource.destroy();
  });

  it('persists append results transactionally and keeps duplicate retries idempotent', async () => {
    const store = new TypeOrmContestEventStore({ getDataSource: () => dataSource } as TypeOrmClient);
    const service = new ContestEventStreamService(store);
    const batch = parseProducerBatchJson({
      streamRevision: 1,
      events: [
        newSolution(1, 100),
        {
          eventId: 2,
          type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
          solutionOnProgressData: { solutionId: 100, percentageProgress: 50 },
        },
      ],
    });

    const first = await service.appendProducerEvents({ uk, producerId: 'producer-a', batch });
    const retry = await service.appendProducerEvents({ uk, producerId: 'producer-a', batch });
    const page = await service.getClientEvents({ uk, afterEventId: 0, limit: 10, streamRevision: 1, compactProgress: false });

    expect(page.uk).toBe(uk);
    expect(first.acceptedEventIds).toEqual([1, 2]);
    expect(retry.duplicateEventIds).toEqual([1, 2]);
    expect(page.latestEventId).toBe(2);
    expect(page.checkpointEventId).toBe(2);
  });

  it('uses normalized table and column names while keeping uk only on contest', async () => {
    const tables = await dataSource.query(
      "SELECT TABLE_NAME AS tableName FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('contest', 'contest_user', 'contest_event_stream', 'contest_event')",
    );
    const streamUkColumns = await dataSource.query(
      "SELECT COLUMN_NAME AS columnName FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contest_event_stream' AND COLUMN_NAME = 'uk'",
    );
    const lookupIndexColumns = await dataSource.query(
      "SELECT COLUMN_NAME AS columnName FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contest_event' AND INDEX_NAME = 'IDX_contest_event_solution_type_lookup' ORDER BY SEQ_IN_INDEX",
    );
    const redundantRevisionIndexRows = await dataSource.query(
      "SELECT INDEX_NAME AS indexName FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contest_event' AND INDEX_NAME = 'IDX_contest_event_revision_event'",
    );
    const columns = await dataSource.query(
      "SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('contest', 'contest_user', 'contest_event_stream', 'contest_event') ORDER BY TABLE_NAME, ORDINAL_POSITION",
    );

    expect(tables.map((row) => row.tableName).sort()).toEqual([
      'contest',
      'contest_event',
      'contest_event_stream',
      'contest_user',
    ]);
    expect(streamUkColumns).toEqual([]);
    expect(lookupIndexColumns.map((row) => row.columnName)).toEqual([
      'contest_id',
      'stream_revision',
      'type',
      'solution_id',
    ]);
    expect(redundantRevisionIndexRows).toEqual([]);
    expect(groupColumnsByTable(columns)).toEqual({
      contest: [
        'id',
        'uk',
        'name',
        'contest',
        'problems',
        'markers',
        'series',
        'sorter',
        'contributors',
        'created_at',
        'updated_at',
      ],
      contest_event: [
        'id',
        'contest_id',
        'event_id',
        'stream_revision',
        'type',
        'producer_id',
        'solution_id',
        'user_id',
        'problem_alias',
        'percentage_progress',
        'previous_result',
        'result',
        'time_ns',
        'solution_submit_time_ns',
        'created_at',
        'payload_hash',
        'payload_bytes',
      ],
      contest_event_stream: [
        'contest_id',
        'last_event_id',
        'stream_revision',
        'producer_id',
        'producer_locked_at',
        'created_at',
        'updated_at',
      ],
      contest_user: [
        'id',
        'contest_id',
        'user_id',
        'name',
        'avatar',
        'photo',
        'organization',
        'location',
        'team_members',
        'markers',
        'official',
        'banned',
        'broadcaster_token',
        'sort_index',
        'created_at',
        'updated_at',
      ],
    });
  });

  it('stores string user fields as plain text and reads them back through the service', async () => {
    const serviceUk = `${uk}-users`;
    createdUks.add(serviceUk);
    const service = new ContestService({ getDataSource: () => dataSource } as TypeOrmClient, new MiscUtils());

    await service.createContest({
      uk: serviceUk,
      name: serviceUk,
      contest: { title: serviceUk, startAt: '2026-01-01T00:00:00Z', duration: [5, 'h'] } as any,
      problems: [],
      markers: [],
      series: [],
      users: [
        {
          id: 'u1',
          name: 'User One',
          organization: 'Org One',
        },
      ],
    });

    const users = await service.findContestUsers(serviceUk);
    const [storedUser] = await dataSource.query(
      'SELECT contest_user.name, contest_user.organization FROM contest_user INNER JOIN contest ON contest.id = contest_user.contest_id WHERE contest.uk = ? AND contest_user.user_id = ?',
      [serviceUk, 'u1'],
    );

    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('User One');
    expect(users[0].organization).toBe('Org One');
    expect(storedUser.name).toBe('User One');
    expect(storedUser.organization).toBe('Org One');
  });

  it('denormalizes submit time and filters frozen non-new events during catch-up', async () => {
    const frozenUk = `${uk}-frozen`;
    createdUks.add(frozenUk);
    await createContestWithStream(dataSource, frozenUk, {
      title: frozenUk,
      startAt: '2026-01-01T00:00:00Z',
      duration: [5, 'h'],
      frozenDuration: [1, 'h'],
    });
    const service = new ContestEventStreamService(new TypeOrmContestEventStore({ getDataSource: () => dataSource } as TypeOrmClient));

    await service.appendProducerEvents({
      uk: frozenUk,
      producerId: 'producer-a',
      batch: parseProducerBatchJson({
        streamRevision: 1,
        events: [
          newSolution(1, 201, 4 * 60 * 60),
          progress(2, 201),
          settle(3, 201),
          newSolution(4, 202, 60 * 60),
          settle(5, 202, 4 * 60 * 60),
        ],
      }),
    });

    const contest = await dataSource.getRepository(ContestEntity).findOneOrFail({ where: { uk: frozenUk } });
    const rows = await dataSource.query(
      'SELECT event_id AS eventId, solution_submit_time_ns AS solutionSubmitTimeNs FROM contest_event WHERE contest_id = ? ORDER BY event_id',
      [contest.id],
    );
    const page = await service.getClientEvents({
      uk: frozenUk,
      afterEventId: 0,
      limit: 10,
      streamRevision: 1,
      compactProgress: false,
    });

    expect(rows.map((row) => [Number(row.eventId), String(row.solutionSubmitTimeNs)])).toEqual([
      [1, '14400000000000'],
      [2, '14400000000000'],
      [3, '14400000000000'],
      [4, '3600000000000'],
      [5, '3600000000000'],
    ]);
    expect(clientEventIds(page.events)).toEqual([1, 4, 5]);
    expect(page.checkpointEventId).toBe(5);
  });
});

function groupColumnsByTable(rows: Array<{ tableName: string; columnName: string }>): Record<string, string[]> {
  return rows.reduce<Record<string, string[]>>((acc, row) => {
    acc[row.tableName] = acc[row.tableName] || [];
    acc[row.tableName].push(row.columnName);
    return acc;
  }, {});
}

async function createContestWithStream(dataSource: DataSource, uk: string, contestConfig: Record<string, unknown>) {
  const contest = await dataSource.getRepository(ContestEntity).save(
    dataSource.getRepository(ContestEntity).create({
      uk,
      name: uk,
      contest: contestConfig as any,
      problems: [],
      markers: [],
      series: [],
      sorter: null,
      contributors: null,
    }),
  );
  await dataSource.getRepository(ContestEventStreamEntity).save(
    dataSource.getRepository(ContestEventStreamEntity).create({
      contestId: contest.id,
      lastEventId: 0,
      streamRevision: 1,
    }),
  );
}

function newSolution(eventId: number, solutionId: number, timeValue = 0) {
  return {
    eventId,
    type: rankland_live_contest_common.EventType.NEW_SOLUTION,
    newSolutionData: {
      solutionId,
      userId: `user-${solutionId}`,
      problemAlias: 'A',
      time: { value: timeValue, unit: rankland_live_contest_common.TimeUnit.S },
    },
  };
}

function progress(eventId: number, solutionId: number) {
  return {
    eventId,
    type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
    solutionOnProgressData: { solutionId, percentageProgress: 50 },
  };
}

function settle(eventId: number, solutionId: number, timeValue = 0) {
  return {
    eventId,
    type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE,
    solutionOnResultSettleData: {
      solutionId,
      result: rankland_live_contest_common.Result.AC,
      time: { value: timeValue, unit: rankland_live_contest_common.TimeUnit.S },
    },
  };
}

function clientEventIds(events: ContestClientEventBO[]): number[] {
  return events.map((event) => event.eventId);
}
