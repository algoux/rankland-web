import { DataSource } from 'typeorm';
import MysqlConfig from '@server/configs/mysql/mysql.config';
import { getMysqlDataSourceOptions } from '@server/database/typeorm-data-source';
import { ContestEntity } from '@server/entities/contest.entity';
import { ContestEventStreamEntity } from '@server/entities/contest-event-stream.entity';
import { ContestUserEntity } from '@server/entities/contest-user.entity';
import { FileEntity } from '@server/entities/file.entity';
import { IdWorkerRegistryEntity } from '@server/entities/id-worker-registry.entity';
import TypeOrmClient from '@server/database/typeorm-client';
import type IdGeneratorConfig from '@server/configs/id-generator/id-generator.config';
import { SNOWFLAKE_EPOCH_MS, SnowflakeIdGenerator } from '@server/lib/snowflake-id';
import IdGeneratorService from '@server/services/id-generator.service';
import ContestService from '../contest.service';
import TypeOrmContestEventStore from '../contest-event-store.typeorm';
import ContestEventStreamService from '../contest-event-stream.service';
import {
  rankland_live_contest_common,
} from '@common/proto/rankland_live_contest';
import { parseProducerBatchJson } from '../contest-event-codec';
import { ContestClientEventBO } from '../contest-event-bo';
import { contestDurationToSeconds } from '@common/modules/contest/contest-metadata';
import { ErrCode } from '@common/enums/err-code.enum';

const runMysqlTests = process.env.RUN_MYSQL_TESTS === 'true';
const testIdGenerator = new SnowflakeIdGenerator({ workerId: 1023 });

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
        id: testIdGenerator.nextId(),
        uk,
        name: uk,
        title: { fallback: uk },
        startAt: new Date('2026-01-01T00:00:00Z'),
        durationS: 5 * 60 * 60,
        frozenDurationS: null,
        banner: null,
        refLinks: null,
        problems: [],
        markers: [],
        series: [],
        sorter: null,
        contributors: null,
        srkFileId: null,
        viewCount: 0,
        redirectUk: null,
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
      const contest = await dataSource.getRepository(ContestEntity).findOne({
        where: { uk: itemUk },
        withDeleted: true,
      });
      const stream = contest
        ? await dataSource.getRepository(ContestEventStreamEntity).findOne({ where: { contestId: contest.id } })
        : null;
      if (contest) {
        await dataSource.query('DELETE FROM file WHERE contest_id = ?', [contest.id]);
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
    const store = new TypeOrmContestEventStore(typeOrmClientFor(dataSource), testIdGenerator);
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
    const page = await service.getClientEvents({
      uk,
      afterEventId: 0,
      limit: 10,
      streamRevision: 1,
      compactProgress: false,
    });
    const storedIds = await dataSource.query('SELECT id FROM contest_event WHERE contest_id = ? ORDER BY event_id', [
      (await dataSource.getRepository(ContestEntity).findOneByOrFail({ uk })).id,
    ]);

    expect(page.uk).toBe(uk);
    expect(first.acceptedEventIds).toEqual([1, 2]);
    expect(retry.duplicateEventIds).toEqual([1, 2]);
    expect(page.latestEventId).toBe(2);
    expect(page.checkpointEventId).toBe(2);
    expect(storedIds.map((row) => String(row.id))).toHaveLength(2);
    expect(storedIds.every((row) => /^\d+$/.test(String(row.id)))).toBe(true);
    expect(BigInt(storedIds[1].id)).toBeGreaterThan(BigInt(storedIds[0].id));
  });

  it('uses normalized table and column names while keeping uk only on contest', async () => {
    const tables = await dataSource.query(
      "SELECT TABLE_NAME AS tableName FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('contest', 'contest_user', 'contest_event_stream', 'contest_event', 'file', 'id_worker_registry')",
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
      "SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('contest', 'contest_user', 'contest_event_stream', 'contest_event', 'file', 'id_worker_registry') ORDER BY TABLE_NAME, ORDINAL_POSITION",
    );
    const idColumnDefinitions = await dataSource.query(
      `SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName, COLUMN_TYPE AS columnType,
              COLUMN_KEY AS columnKey, EXTRA AS extra
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND ((TABLE_NAME = 'contest' AND COLUMN_NAME = 'id')
           OR (TABLE_NAME = 'contest_user' AND COLUMN_NAME IN ('id', 'contest_id'))
           OR (TABLE_NAME = 'contest_event' AND COLUMN_NAME IN ('id', 'contest_id'))
           OR (TABLE_NAME = 'contest_event_stream' AND COLUMN_NAME = 'contest_id')
           OR (TABLE_NAME = 'file' AND COLUMN_NAME IN ('id', 'contest_id'))
           OR (TABLE_NAME = 'id_worker_registry' AND COLUMN_NAME IN ('id', 'worker_id', 'reserved_until_ms')))
       ORDER BY TABLE_NAME, ORDINAL_POSITION`,
    );

    expect(tables.map((row) => row.tableName).sort()).toEqual([
      'contest',
      'contest_event',
      'contest_event_stream',
      'contest_user',
      'file',
      'id_worker_registry',
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
        'title',
        'start_at',
        'duration_s',
        'frozen_duration_s',
        'banner',
        'ref_links',
        'problems',
        'markers',
        'series',
        'sorter',
        'contributors',
        'srk_file_id',
        'view_count',
        'redirect_uk',
        'created_at',
        'updated_at',
        'deleted_at',
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
      file: [
        'id',
        'contest_id',
        'category',
        'name',
        'path',
        'size',
        'hash_type',
        'hash_value',
        'created_at',
        'updated_at',
        'deleted_at',
      ],
      id_worker_registry: ['id', 'worker_id', 'reserved_until_ms', 'host', 'pid', 'created_at', 'updated_at'],
    });
    expect(idColumnDefinitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tableName: 'contest',
          columnName: 'id',
          columnType: 'bigint unsigned',
          columnKey: 'PRI',
          extra: '',
        }),
        expect.objectContaining({
          tableName: 'contest_user',
          columnName: 'id',
          columnType: 'bigint unsigned',
          columnKey: 'PRI',
          extra: '',
        }),
        expect.objectContaining({ tableName: 'contest_user', columnName: 'contest_id', columnType: 'bigint unsigned' }),
        expect.objectContaining({
          tableName: 'contest_event',
          columnName: 'id',
          columnType: 'bigint unsigned',
          columnKey: 'PRI',
          extra: '',
        }),
        expect.objectContaining({
          tableName: 'contest_event',
          columnName: 'contest_id',
          columnType: 'bigint unsigned',
        }),
        expect.objectContaining({
          tableName: 'contest_event_stream',
          columnName: 'contest_id',
          columnType: 'bigint unsigned',
          columnKey: 'PRI',
        }),
        expect.objectContaining({
          tableName: 'file',
          columnName: 'id',
          columnType: 'bigint unsigned',
          columnKey: 'PRI',
        }),
        expect.objectContaining({ tableName: 'file', columnName: 'contest_id', columnType: 'bigint unsigned' }),
        expect.objectContaining({
          tableName: 'id_worker_registry',
          columnName: 'id',
          columnType: 'bigint unsigned',
          columnKey: 'PRI',
          extra: 'auto_increment',
        }),
        expect.objectContaining({
          tableName: 'id_worker_registry',
          columnName: 'worker_id',
          columnType: 'smallint unsigned',
        }),
        expect.objectContaining({
          tableName: 'id_worker_registry',
          columnName: 'reserved_until_ms',
          columnType: 'bigint unsigned',
        }),
      ]),
    );
  });

  it('stores string user fields as plain text and reads them back through the service', async () => {
    const serviceUk = `${uk}-users`;
    createdUks.add(serviceUk);
    const service = new ContestService(typeOrmClientFor(dataSource), testIdGenerator);

    await service.createContest({
      uk: serviceUk,
      name: serviceUk,
      title: { fallback: serviceUk },
      startAt: '2026-01-01T00:00:00Z',
      duration: [5, 'h'],
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

  it('keeps contest reads side-effect free and manages views and soft deletion explicitly', async () => {
    const managementUk = `${uk}-management`;
    createdUks.add(managementUk);
    const service = new ContestService(typeOrmClientFor(dataSource), testIdGenerator);

    await service.createContest({
      uk: managementUk,
      name: managementUk,
      title: { fallback: managementUk },
      startAt: '2026-01-01T00:00:00.999Z',
      duration: [0.5, 'min'],
      frozenDuration: null,
      problems: null,
      users: [],
      markers: null,
      series: null,
      sorter: null,
    });

    const before = await service.getContestWithUsers(managementUk, false);
    expect(before).toMatchObject({ viewCount: 0, duration: [30, 's'], problems: null });
    expect(before.startAt).not.toContain('.999');

    await service.reportView(managementUk);
    await service.reportView(managementUk);
    const after = await service.getContestWithUsers(managementUk, false);
    expect(after.viewCount).toBe(2);
    expect((await service.getContest(managementUk)).viewCount).toBe(2);

    await service.deleteContest(managementUk.toUpperCase());
    await expect(service.getContest(managementUk)).rejects.toThrow();
    await expect(service.findContestUsers(managementUk)).rejects.toThrow();
    await expect(service.reportView(managementUk)).rejects.toThrow();
    expect((await service.listContests(false)).contests.some((item) => item.uk === managementUk)).toBe(false);
    const adminItem = (await service.listContests(true)).contests.find((item) => item.uk === managementUk);
    expect(adminItem?.deletedAt).toEqual(expect.any(String));
    expect(await service.getContestWithUsers(managementUk, true)).toMatchObject({ viewCount: 2 });
  });

  it('aggregates views only from active contests with an SRK file', async () => {
    const staticUk = `${uk}-statistics-static`;
    const liveOnlyUk = `${uk}-statistics-live-only`;
    const deletedUk = `${uk}-statistics-deleted`;
    createdUks.add(staticUk);
    createdUks.add(liveOnlyUk);
    createdUks.add(deletedUk);
    const service = new ContestService(typeOrmClientFor(dataSource), testIdGenerator);
    const before = await service.getPublicStatistics();
    const createInput = (contestUk: string): Parameters<ContestService['createContest']>[0] => ({
      uk: contestUk,
      name: contestUk,
      title: { fallback: contestUk },
      startAt: '2026-01-01T00:00:00Z',
      duration: [5, 'h'],
      problems: [],
      markers: [],
      series: [],
      users: [],
    });

    await service.createContest(createInput(staticUk));
    await service.createContest(createInput(liveOnlyUk));
    await service.createContest(createInput(deletedUk));
    const staticContest = await service.getContest(staticUk);
    const liveOnlyContest = await service.getContest(liveOnlyUk);
    const deletedContest = await service.getContest(deletedUk);
    const fileRepository = dataSource.getRepository(FileEntity);
    const createFile = async (contestId: string, name: string) => {
      const id = testIdGenerator.nextId();
      return fileRepository.save(fileRepository.create({
        id,
        contestId,
        category: 'RankMain',
        name,
        path: `${id}/${name}`,
        size: 1,
        hashType: 'sha256',
        hashValue: '0'.repeat(64),
      }));
    };
    const staticFile = await createFile(staticContest.id, `${staticUk}.srk.json`);
    const deletedFile = await createFile(deletedContest.id, `${deletedUk}.srk.json`);
    await service.updateContest({ uk: staticUk, srkFileID: staticFile.id });
    await service.updateContest({ uk: deletedUk, srkFileID: deletedFile.id });
    await dataSource.getRepository(ContestEntity).update({ id: staticContest.id }, { viewCount: 11 });
    await dataSource.getRepository(ContestEntity).update({ id: liveOnlyContest.id }, { viewCount: 1_000 });
    await dataSource.getRepository(ContestEntity).update({ id: deletedContest.id }, { viewCount: 700 });
    await service.deleteContest(deletedUk);

    await expect(service.getPublicStatistics()).resolves.toEqual({
      totalSrkCount: before.totalSrkCount + 1,
      totalViewCount: before.totalViewCount + 11,
    });
  });

  it('only associates active files from the same contest and rejects case-insensitive self redirects', async () => {
    const ownerUk = `${uk}-file-owner`;
    const otherUk = `${uk}-file-other`;
    createdUks.add(ownerUk);
    createdUks.add(otherUk);
    const service = new ContestService(typeOrmClientFor(dataSource), testIdGenerator);
    const createInput = (contestUk: string): Parameters<ContestService['createContest']>[0] => ({
      uk: contestUk,
      name: contestUk,
      title: { fallback: contestUk },
      startAt: '2026-01-01T00:00:00Z',
      duration: [5, 'h'],
      problems: [],
      markers: [],
      series: [],
      users: [],
    });
    await service.createContest(createInput(ownerUk));
    await service.createContest(createInput(otherUk));
    const owner = await service.getContest(ownerUk);
    const other = await service.getContest(otherUk);
    const fileRepository = dataSource.getRepository(FileEntity);
    const saveFile = (contestId: string, name: string) => {
      const id = testIdGenerator.nextId();
      return fileRepository.save(
        fileRepository.create({
          id,
          contestId,
          category: '',
          name,
          path: `${id}/${name}`,
          size: 1,
          hashType: 'sha256',
          hashValue: '0'.repeat(64),
        }),
      );
    };
    const ownFile = await saveFile(owner.id, 'own.srk.json');
    const otherFile = await saveFile(other.id, 'other.srk.json');
    const deletedFile = await saveFile(owner.id, 'deleted.srk.json');
    await fileRepository.softDelete({ id: deletedFile.id });

    await service.updateContest({ uk: ownerUk, srkFileID: ownFile.id });
    expect((await service.getContest(ownerUk)).srkFileId).toBe(ownFile.id);
    await expect(
      service.updateContest({ uk: ownerUk, srkFileID: otherFile.id }),
    ).rejects.toMatchObject({ code: ErrCode.FileNotFound });
    await expect(
      service.updateContest({ uk: ownerUk, srkFileID: deletedFile.id }),
    ).rejects.toMatchObject({ code: ErrCode.FileNotFound });
    await expect(
      service.updateContest({ uk: ownerUk.toUpperCase(), redirectUK: ownerUk }),
    ).rejects.toMatchObject({ code: ErrCode.IllegalParameters });

    await service.updateContest({ uk: ownerUk, srkFileID: null });
    expect((await service.getContest(ownerUk)).srkFileId).toBeNull();
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
    const service = new ContestEventStreamService(
      new TypeOrmContestEventStore(typeOrmClientFor(dataSource), testIdGenerator),
    );

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

  it('assigns disjoint worker slots to concurrently initialized generators', async () => {
    const typeOrmClient = typeOrmClientFor(dataSource);
    const generatorConfig: IdGeneratorConfig = { workerIdOverride: undefined };
    const first = new IdGeneratorService(typeOrmClient, generatorConfig);
    const second = new IdGeneratorService(typeOrmClient, generatorConfig);
    const existingRegistrationRows = await dataSource.query('SELECT id FROM id_worker_registry WHERE pid = ?', [
      process.pid,
    ]);
    const existingRegistrationIds = new Set(existingRegistrationRows.map((row) => String(row.id)));

    try {
      const initializationResults = await Promise.allSettled([first.init(), second.init()]);
      const initializationFailure = initializationResults.find(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );
      if (initializationFailure) {
        throw initializationFailure.reason;
      }
      const firstIds = Array.from({ length: 100 }, () => first.nextId());
      const secondIds = Array.from({ length: 100 }, () => second.nextId());
      const allIds = [...firstIds, ...secondIds];
      const firstWorker = (BigInt(firstIds[0]) >> 12n) & 0x3ffn;
      const secondWorker = (BigInt(secondIds[0]) >> 12n) & 0x3ffn;
      const createdRegistrationIds = await findNewRegistryIdsForProcess(dataSource, existingRegistrationIds);
      const earliestTimestampMs = Math.min(...allIds.map((id) => Number(BigInt(id) >> 22n) + SNOWFLAKE_EPOCH_MS));

      expect(firstWorker).not.toBe(secondWorker);
      expect(createdRegistrationIds).toHaveLength(2);
      expect(new Set(allIds)).toHaveLength(200);
      expect(earliestTimestampMs).toBeGreaterThanOrEqual(SNOWFLAKE_EPOCH_MS);
    } finally {
      try {
        await Promise.all([first.dispose(), second.dispose()]);
      } finally {
        const createdRegistrationIds = await findNewRegistryIdsForProcess(dataSource, existingRegistrationIds);
        if (createdRegistrationIds.length > 0) {
          await dataSource.query(
            `DELETE FROM id_worker_registry WHERE id IN (${createdRegistrationIds.map(() => '?').join(', ')})`,
            createdRegistrationIds,
          );
        }
      }
    }
  });

  it('preserves updated_at microseconds when TypeORM updates business rows', async () => {
    const contest = await dataSource.getRepository(ContestEntity).findOneByOrFail({ uk });
    const user = await dataSource.getRepository(ContestUserEntity).save(
      dataSource.getRepository(ContestUserEntity).create({
        id: testIdGenerator.nextId(),
        contestId: contest.id,
        userId: 'updated-at-user',
        name: 'Before update',
        official: true,
        banned: false,
        sortIndex: 0,
      }),
    );
    const registration = await dataSource.getRepository(IdWorkerRegistryEntity).save(
      dataSource.getRepository(IdWorkerRegistryEntity).create({
        workerId: null,
        reservedUntilMs: null,
        host: 'vitest',
        pid: process.pid,
      }),
    );

    try {
      await waitForMysqlFractionalSecond(dataSource);
      await dataSource.getRepository(ContestEntity).update({ id: contest.id }, { name: `${uk}-updated` });
      await waitForMysqlFractionalSecond(dataSource);
      user.name = 'After update';
      await dataSource.getRepository(ContestUserEntity).save(user);
      const [firstUserUpdate] = await dataSource.query(
        'SELECT CAST(updated_at AS CHAR(26)) AS updatedAt FROM contest_user WHERE id = ?',
        [user.id],
      );
      await waitForMysqlTimestampAfter(dataSource, firstUserUpdate.updatedAt);
      user.official = false;
      await dataSource.getRepository(ContestUserEntity).save(user);
      await waitForMysqlFractionalSecond(dataSource);
      const stream = await dataSource
        .getRepository(ContestEventStreamEntity)
        .findOneByOrFail({ contestId: contest.id });
      stream.lastEventId += 1;
      await dataSource.getRepository(ContestEventStreamEntity).save(stream);
      await waitForMysqlFractionalSecond(dataSource);
      await dataSource
        .getRepository(IdWorkerRegistryEntity)
        .update({ id: registration.id }, { reservedUntilMs: String(Date.now() + 10_000) });

      const rows = await dataSource.query(
        `SELECT 'contest' AS tableName, MICROSECOND(updated_at) AS microseconds FROM contest WHERE id = ?
         UNION ALL
         SELECT 'contest_user', MICROSECOND(updated_at) FROM contest_user WHERE id = ?
         UNION ALL
         SELECT 'contest_event_stream', MICROSECOND(updated_at) FROM contest_event_stream WHERE contest_id = ?
         UNION ALL
         SELECT 'id_worker_registry', MICROSECOND(updated_at) FROM id_worker_registry WHERE id = ?`,
        [contest.id, user.id, contest.id, registration.id],
      );
      const [secondUserUpdate] = await dataSource.query(
        'SELECT CAST(updated_at AS CHAR(26)) AS updatedAt FROM contest_user WHERE id = ?',
        [user.id],
      );
      const secondPrecisionTables = rows
        .filter((row) => Number(row.microseconds) === 0)
        .map((row) => row.tableName);

      expect(secondPrecisionTables).toEqual([]);
      expect(secondUserUpdate.updatedAt > firstUserUpdate.updatedAt).toBe(true);
    } finally {
      await dataSource.getRepository(IdWorkerRegistryEntity).delete({ id: registration.id });
    }
  });
});

async function findNewRegistryIdsForProcess(
  dataSource: DataSource,
  existingRegistrationIds: ReadonlySet<string>,
): Promise<string[]> {
  const rows = await dataSource.query('SELECT id FROM id_worker_registry WHERE pid = ?', [process.pid]);
  return rows.map((row) => String(row.id)).filter((id) => !existingRegistrationIds.has(id));
}

async function waitForMysqlFractionalSecond(dataSource: DataSource): Promise<void> {
  for (;;) {
    const [row] = await dataSource.query('SELECT MICROSECOND(CURRENT_TIMESTAMP(6)) AS microseconds');
    const microseconds = Number(row.microseconds);
    if (microseconds >= 100_000 && microseconds <= 800_000) {
      return;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
  }
}

async function waitForMysqlTimestampAfter(dataSource: DataSource, timestamp: string): Promise<void> {
  for (;;) {
    const [row] = await dataSource.query(
      'SELECT CAST(CURRENT_TIMESTAMP(6) AS CHAR(26)) AS currentTimestamp',
    );
    if (row.currentTimestamp > timestamp) {
      return;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 1);
    });
  }
}

function groupColumnsByTable(rows: Array<{ tableName: string; columnName: string }>): Record<string, string[]> {
  return rows.reduce<Record<string, string[]>>((acc, row) => {
    acc[row.tableName] = acc[row.tableName] || [];
    acc[row.tableName].push(row.columnName);
    return acc;
  }, {});
}

async function createContestWithStream(dataSource: DataSource, uk: string, contestConfig: Record<string, unknown>) {
  const title = contestConfig.title;
  const duration = contestConfig.duration;
  const frozenDuration = contestConfig.frozenDuration;
  const contest = await dataSource.getRepository(ContestEntity).save(
    dataSource.getRepository(ContestEntity).create({
      id: testIdGenerator.nextId(),
      uk,
      name: uk,
      title: typeof title === 'string' ? { fallback: title } : (title as any),
      startAt: new Date(String(contestConfig.startAt)),
      durationS: contestDurationToSeconds(duration),
      frozenDurationS:
        frozenDuration === null || frozenDuration === undefined
          ? null
          : contestDurationToSeconds(frozenDuration),
      banner: (contestConfig.banner as any) ?? null,
      refLinks: (contestConfig.refLinks as any) ?? null,
      problems: [],
      markers: [],
      series: [],
      sorter: null,
      contributors: null,
      srkFileId: null,
      viewCount: 0,
      redirectUk: null,
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

function typeOrmClientFor(dataSource: DataSource): TypeOrmClient {
  const client = Object.create(TypeOrmClient.prototype) as TypeOrmClient;
  client.getDataSource = () => dataSource;
  return client;
}
