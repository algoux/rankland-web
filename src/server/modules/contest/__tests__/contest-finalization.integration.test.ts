import { ContestStatus } from '@common/modules/contest/contest-status';
import { createHash } from 'crypto';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { DataSource, type QueryRunner } from 'typeorm';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrCode } from '@common/enums/err-code.enum';
import { rankland_live_contest_common as proto } from '@common/proto/rankland_live_contest';
import { getMysqlDataSourceOptions } from '@server/database/typeorm-data-source';
import type TypeOrmClient from '@server/database/typeorm-client';
import { ContestEntity } from '@server/entities/contest.entity';
import { ContestEventEntity } from '@server/entities/contest-event.entity';
import { ContestEventStreamEntity } from '@server/entities/contest-event-stream.entity';
import { ContestUserEntity } from '@server/entities/contest-user.entity';
import { FileEntity } from '@server/entities/file.entity';
import { SnowflakeIdGenerator } from '@server/lib/snowflake-id';
import FileService from '@server/modules/file/file.service';
import FsFileStorageProvider from '@server/modules/file/providers/fs-file-storage.provider';
import { FileStorageProviderError } from '@server/modules/file/providers/file-storage-provider';
import type { ContestProducerEventBO } from '../contest-event-bo';
import TypeOrmContestEventStore from '../contest-event-store.typeorm';
import ContestEventStreamService from '../contest-event-stream.service';
import ContestFinalizationService from '../contest-finalization.service';
import ContestService from '../contest.service';

// Destructive schema setup is restricted to this dedicated local test database.
// Never use the application's MYSQL_* variables for this suite.
const TEST_DATABASE = 'rankland_finalization_test';
const runMysqlTests = process.env.RUN_FINALIZATION_MYSQL_TESTS === 'true';
const ids = new SnowflakeIdGenerator({ workerId: 1022 });

describe.runIf(runMysqlTests)('contest finalization with isolated MySQL and real FS', () => {
  let dataSource: DataSource;
  let storagePath: string;
  let contests: ContestService;
  let streams: ContestEventStreamService;
  let files: FileService;
  let finalization: ContestFinalizationService;
  let provider: FsFileStorageProvider;
  let uk: string;
  let contestId: string;

  beforeAll(async () => {
    dataSource = new DataSource({
      ...getMysqlDataSourceOptions({
        host: '127.0.0.1',
        port: 33324,
        username: 'blue',
        password: 'test',
        database: TEST_DATABASE,
        connectionLimit: 12,
      }),
      entities: [ContestEntity, ContestUserEntity, ContestEventStreamEntity, ContestEventEntity, FileEntity],
      migrations: [],
      migrationsRun: false,
      synchronize: false,
    });
    await dataSource.initialize();
    const [selectedDatabase] = await dataSource.query('SELECT DATABASE() AS db');
    if (selectedDatabase.db !== TEST_DATABASE) throw new Error('Refusing to reset a non-test database');
    await dataSource.dropDatabase();
    await dataSource.synchronize();
  }, 30_000);

  beforeEach(async () => {
    storagePath = await mkdtemp(path.join(tmpdir(), 'rankland-finalization-integration-'));
    const client = clientFor(dataSource);
    const config = { fs: { basePath: storagePath }, fileBaseUrl: 'https://example.invalid/files' };
    provider = new FsFileStorageProvider(config as any);
    contests = new ContestService(client, ids);
    streams = new ContestEventStreamService(new TypeOrmContestEventStore(client, ids));
    files = new FileService(client, ids, config as any, { resolve: () => provider } as any);
    finalization = new ContestFinalizationService(client, contests, files);
    uk = `finalization-${ids.nextId()}`;
    const created = await contests.createContest({
      uk,
      name: uk,
      title: { fallback: 'Final Contest' },
      startAt: '2026-10-24T00:00:00Z',
      duration: [300, 's'],
      frozenDuration: [60, 's'],
      problems: [{ alias: 'A' }, { alias: 'B' }],
      markers: [],
      series: [],
      sorter: { algorithm: 'ICPC', config: { penalty: [20, 'min'] } },
      users: [{ id: 'alice', name: 'Alice', banned: true, broadcasterToken: 'secret-token' }],
    });
    contestId = created._id;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (storagePath) await rm(storagePath, { recursive: true, force: true });
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  async function append(events: ContestProducerEventBO[]) {
    return streams.appendProducerEvents({
      uk,
      producerId: 'integration-producer',
      batch: { streamRevision: 1, events },
    });
  }

  async function readFinalFile() {
    const contest = await dataSource.getRepository(ContestEntity).findOneByOrFail({ id: contestId });
    const file = await dataSource.getRepository(FileEntity).findOneByOrFail({ id: contest.srkFileId! });
    const buffer = await readFile(path.join(storagePath, file.path));
    return { contest, file, buffer, ranklist: JSON.parse(buffer.toString()) };
  }

  async function uploadStaticFile(ownerContestId = contestId) {
    const buffer = Buffer.from('{"static":true}');
    return files.uploadFile({
      contestId: ownerContestId,
      category: 'RankMain',
      file: { originalname: 'static.srk.json', buffer, size: buffer.length, mimetype: 'application/json' },
    });
  }

  function interceptNextRunner(change: (runner: QueryRunner) => void) {
    const createRunner = dataSource.createQueryRunner.bind(dataSource);
    vi.spyOn(dataSource, 'createQueryRunner').mockImplementationOnce((mode) => {
      const runner = createRunner(mode);
      change(runner);
      return runner;
    });
  }

  it('archives actual unmasked SRK bytes, strips private user fields, and returns the same file on retry', async () => {
    await append([submission(1, 101), settlement(2, 101)]);
    const uploadSpy = vi.spyOn(provider, 'upload');
    const before = await streams.getClientEvents({ uk, afterEventId: 0, limit: 10, streamRevision: 1 });
    expect(before.events.map((event) => event.type)).toEqual([proto.EventType.NEW_SOLUTION]);
    const privileged = await streams.getClientEvents({
      uk,
      afterEventId: 0,
      limit: 10,
      streamRevision: 1,
      ignoreFrozen: true,
    });
    expect(privileged.events[1].solutionOnResultSettleData!.result).toBe(proto.Result.AC);

    const result = await finalization.finalize(uk);
    const archived = await readFinalFile();
    expect(result.response).toEqual({ uk, status: ContestStatus.Finalized, srkFileID: archived.file.id });
    expect(archived.contest.status).toBe(ContestStatus.Finalized);
    expect(archived.file).toMatchObject({
      name: `${uk}.srk.json`,
      category: 'RankMain',
      size: archived.buffer.length,
      hashType: 'sha256',
      hashValue: createHash('sha256').update(archived.buffer).digest('hex'),
    });
    expect(archived.ranklist.contest.frozenDuration).toEqual([60, 's']);
    expect(archived.ranklist.rows[0]).toMatchObject({
      user: { id: 'alice', name: 'Alice' },
      score: { value: 1 },
      statuses: [{ result: 'FB' }, expect.any(Object)],
    });
    expect(archived.ranklist.rows[0].user).not.toHaveProperty('banned');
    expect(archived.ranklist.rows[0].user).not.toHaveProperty('broadcasterToken');
    expect(archived.buffer.toString()).not.toContain('secret-token');
    expect(archived.buffer.toString()).not.toContain('contestId');
    const after = await streams.getClientEvents({ uk, afterEventId: 0, limit: 10, streamRevision: 1 });
    expect(after.streamRevision).toBe(1);
    expect(after.events[1].solutionOnResultSettleData!.result).toBe(proto.Result.AC);
    expect((await finalization.finalize(uk)).response).toEqual(result.response);
    expect(uploadSpy).toHaveBeenCalledTimes(1);
    expect(await dataSource.getRepository(FileEntity).countBy({ contestId })).toBe(1);
  });

  it('serializes concurrent finalizations and stores one object', async () => {
    await append([submission(1, 101), settlement(2, 101)]);
    const entered = deferred();
    const release = deferred();
    const upload = provider.upload.bind(provider);
    const uploadSpy = vi.spyOn(provider, 'upload').mockImplementation(async (input) => {
      entered.resolve();
      await release.promise;
      await upload(input);
    });
    const first = finalization.finalize(uk);
    await entered.promise;
    const second = finalization.finalize(uk);
    release.resolve();
    const results = await Promise.all([first, second]);
    expect(results[0].response).toEqual(results[1].response);
    expect(uploadSpy).toHaveBeenCalledTimes(1);
    expect(await dataSource.getRepository(FileEntity).countBy({ contestId })).toBe(1);
  });

  it('archives an existing special-character UK using a safe filename', async () => {
    uk = `special-${ids.nextId()}/part\\name\n`;
    const created = await contests.createContest({
      uk,
      name: 'Special UK',
      title: { fallback: 'Special UK' },
      startAt: '2026-10-24T00:00:00Z',
      duration: [300, 's'],
      problems: [],
      markers: [],
      series: [],
    });
    contestId = created._id;
    expect((await finalization.finalize(uk)).response).toMatchObject({ uk, status: ContestStatus.Finalized });
    const { file, contest } = await readFinalFile();
    expect(contest.uk).toBe(uk);
    expect(file.name).toBe(`${uk.replace(/[\p{Cc}/\\]/gu, '_')}.srk.json`);
    expect(file.path).toBe(`${file.id}/${file.name}`);
    expect(path.basename(file.name)).toBe(file.name);
  });

  it('holds the contest lock across upload against event appends and public user changes', async () => {
    await append([submission(1, 101), settlement(2, 101)]);
    const entered = deferred();
    const release = deferred();
    const upload = provider.upload.bind(provider);
    vi.spyOn(provider, 'upload').mockImplementation(async (input) => {
      entered.resolve();
      await release.promise;
      await upload(input);
    });
    const finalizing = finalization.finalize(uk);
    await entered.promise;
    let mutationsSettled = false;
    const writes = Promise.allSettled([
      append([submission(3, 102), settlement(4, 102)]),
      contests.updateContestUser(uk, 'alice', { name: 'Changed' }),
      contests.upsertContestUsers(contestId, [{ id: 'bob', name: 'Bob' }]),
      contests.replaceContestUsers(contestId, [{ id: 'bob', name: 'Bob' }]),
      contests.dropEvents(uk),
    ]).then((result) => {
      mutationsSettled = true;
      return result;
    });
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(mutationsSettled).toBe(false);
    release.resolve();
    await finalizing;
    for (const outcome of await writes) {
      expect(outcome).toMatchObject({ status: 'rejected', reason: { code: ErrCode.ContestFinalized } });
    }
    expect((await readFinalFile()).ranklist.rows[0].user.name).toBe('Alice');
    expect(await dataSource.getRepository(ContestEventEntity).countBy({ contestId })).toBe(2);
  });

  it('waits for an earlier user transaction and archives its committed public name', async () => {
    const runner = dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    await contests.findLockedContestAndStream(runner.manager, uk);
    await runner.manager
      .getRepository(ContestUserEntity)
      .update({ contestId, userId: 'alice' }, { name: 'Committed Alice' });
    const finishing = finalization.finalize(uk);
    await runner.commitTransaction();
    await runner.release();
    await finishing;
    expect((await readFinalFile()).ranklist.rows[0].user.name).toBe('Committed Alice');
  });

  it.each(['upload', 'file-save', 'contest-update', 'commit'] as const)(
    'rolls back contest/file metadata and removes the uploaded object after %s failure',
    async (stage) => {
      await append([submission(1, 101), settlement(2, 101)]);
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const failure = new Error(`injected ${stage} failure`);
      const upload = provider.upload.bind(provider);
      const uploadSpy = vi.spyOn(provider, 'upload').mockImplementation(async (input) => {
        await upload(input);
        if (stage === 'upload') throw new FileStorageProviderError('unavailable', failure);
      });
      const removeSpy = vi.spyOn(provider, 'remove');
      if (stage !== 'upload') {
        interceptNextRunner((runner) => {
          if (stage === 'file-save')
            vi.spyOn(runner.manager.getRepository(FileEntity), 'save').mockRejectedValueOnce(failure);
          if (stage === 'contest-update')
            vi.spyOn(runner.manager.getRepository(ContestEntity), 'update').mockRejectedValueOnce(failure);
          if (stage === 'commit') vi.spyOn(runner, 'commitTransaction').mockRejectedValueOnce(failure);
        });
      }
      await expect(finalization.finalize(uk)).rejects.toBeDefined();
      expect(await dataSource.getRepository(ContestEntity).findOneByOrFail({ id: contestId })).toMatchObject({
        status: ContestStatus.Created,
        srkFileId: null,
      });
      expect(await dataSource.getRepository(FileEntity).countBy({ contestId })).toBe(0);
      expect(removeSpy).toHaveBeenCalledTimes(1);
      const objectPath = uploadSpy.mock.calls[0][0].path;
      expect(removeSpy).toHaveBeenCalledWith(objectPath);
      await expect(readFile(path.join(storagePath, objectPath))).rejects.toMatchObject({ code: 'ENOENT' });
    },
  );

  it('recovers a committed finalization when its commit acknowledgement is lost', async () => {
    const removeSpy = vi.spyOn(provider, 'remove');
    interceptNextRunner((runner) => {
      const commit = runner.commitTransaction.bind(runner);
      vi.spyOn(runner, 'commitTransaction').mockImplementationOnce(async () => {
        await commit();
        throw new Error('injected lost COMMIT acknowledgement');
      });
    });
    const result = await finalization.finalize(uk);
    const { file, contest } = await readFinalFile();
    expect(result.response.srkFileID).toBe(file.id);
    expect(contest.status).toBe(ContestStatus.Finalized);
    expect(removeSpy).not.toHaveBeenCalled();
  });

  it.each(['throw', 'leave-active'] as const)(
    'discards a live transaction session when rollback does not finish (%s) before reconciling through a one-slot pool',
    async (rollbackFailure) => {
      // A single connection makes reusing the failed transaction deterministic without discarding.
      const singleConnectionSource = new DataSource({
        ...dataSource.options,
        extra: { ...(dataSource.options as any).extra, connectionLimit: 1 },
      });
      await singleConnectionSource.initialize();
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const client = clientFor(singleConnectionSource);
      const localContests = new ContestService(client, ids);
      const localFiles = new FileService(
        client,
        ids,
        { fs: { basePath: storagePath }, fileBaseUrl: 'https://example.invalid/files' } as any,
        { resolve: () => provider } as any,
      );
      const localFinalization = new ContestFinalizationService(client, localContests, localFiles);
      const failure = new Error('injected contest update failure after file metadata was saved');
      const removeSpy = vi.spyOn(provider, 'remove');
      const uploadSpy = vi.spyOn(provider, 'upload');
      let savedFileCount = 0;
      let originalConnectionId: number | undefined;
      let destroySpy: ReturnType<typeof vi.spyOn> | undefined;
      const createRunner = singleConnectionSource.createQueryRunner.bind(singleConnectionSource);
      vi.spyOn(singleConnectionSource, 'createQueryRunner').mockImplementationOnce((mode) => {
        const runner = createRunner(mode);
        const connect = runner.connect.bind(runner);
        vi.spyOn(runner, 'connect').mockImplementationOnce(async () => {
          const connection = await connect();
          originalConnectionId = connection.threadId;
          destroySpy = vi.spyOn(connection, 'destroy');
          return connection;
        });
        vi.spyOn(runner.manager.getRepository(ContestEntity), 'update').mockImplementationOnce(async () => {
          savedFileCount = await runner.manager.getRepository(FileEntity).countBy({ contestId });
          throw failure;
        });
        if (rollbackFailure === 'throw') {
          vi.spyOn(runner, 'rollbackTransaction').mockRejectedValueOnce(
            new Error('injected rollback transport failure'),
          );
        } else {
          vi.spyOn(runner, 'rollbackTransaction').mockResolvedValueOnce(undefined);
        }
        return runner;
      });

      try {
        await expect(localFinalization.finalize(uk)).rejects.toBe(failure);
        expect(savedFileCount).toBe(1);
        expect(destroySpy).toHaveBeenCalled();
        const [newConnection] = await singleConnectionSource.query('SELECT CONNECTION_ID() AS id');
        expect(newConnection.id).not.toBe(originalConnectionId);
        expect(await singleConnectionSource.getRepository(FileEntity).countBy({ contestId })).toBe(0);
        expect(await localContests.getContest(uk)).toMatchObject({ status: ContestStatus.Created, srkFileId: null });
        expect(removeSpy).toHaveBeenCalledWith(uploadSpy.mock.calls[0][0].path);
        await expect(readFile(path.join(storagePath, uploadSpy.mock.calls[0][0].path))).rejects.toMatchObject({
          code: 'ENOENT',
        });
        // The recovered pool remains usable; a subsequent real finalization commits normally.
        const retry = await localFinalization.finalize(uk);
        expect(retry.response.status).toBe(ContestStatus.Finalized);
        expect(await singleConnectionSource.getRepository(FileEntity).countBy({ contestId })).toBe(1);
      } finally {
        await singleConnectionSource.destroy();
      }
    },
  );

  it('retains the object if reconciliation cannot determine the database outcome', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const uploadSpy = vi.spyOn(provider, 'upload');
    const removeSpy = vi.spyOn(provider, 'remove');
    const createRunner = dataSource.createQueryRunner.bind(dataSource);
    vi.spyOn(dataSource, 'createQueryRunner')
      .mockImplementationOnce((mode) => {
        const runner = createRunner(mode);
        vi.spyOn(runner, 'commitTransaction').mockRejectedValueOnce(new Error('injected COMMIT failure'));
        return runner;
      })
      .mockImplementationOnce((mode) => {
        const runner = createRunner(mode);
        vi.spyOn(runner, 'connect').mockRejectedValueOnce(new Error('injected reconciliation outage'));
        return runner;
      });
    await expect(finalization.finalize(uk)).rejects.toThrow('injected COMMIT failure');
    expect(removeSpy).not.toHaveBeenCalled();
    await expect(readFile(path.join(storagePath, uploadSpy.mock.calls[0][0].path))).resolves.toBeInstanceOf(Buffer);
  });

  it('destroys a failed reconciliation transaction and releases its contest lock before returning the original error', async () => {
    const singleConnectionSource = new DataSource({
      ...dataSource.options,
      extra: { ...(dataSource.options as any).extra, connectionLimit: 1 },
    });
    await singleConnectionSource.initialize();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const client = clientFor(singleConnectionSource);
    const localContests = new ContestService(client, ids);
    const localFinalization = new ContestFinalizationService(client, localContests, files);
    const failure = new Error('injected original COMMIT failure');
    const uploadSpy = vi.spyOn(provider, 'upload');
    const removeSpy = vi.spyOn(provider, 'remove');
    let failedConnectionId: number | undefined;
    let destroySpy: ReturnType<typeof vi.spyOn> | undefined;
    let reachedFileLookup = false;
    const createRunner = singleConnectionSource.createQueryRunner.bind(singleConnectionSource);
    vi.spyOn(singleConnectionSource, 'createQueryRunner')
      .mockImplementationOnce((mode) => {
        const runner = createRunner(mode);
        vi.spyOn(runner, 'commitTransaction').mockRejectedValueOnce(failure);
        return runner;
      })
      .mockImplementationOnce((mode) => {
        const runner = createRunner(mode);
        const connect = runner.connect.bind(runner);
        vi.spyOn(runner, 'connect').mockImplementationOnce(async () => {
          const connection = await connect();
          failedConnectionId = connection.threadId;
          destroySpy = vi.spyOn(connection, 'destroy');
          return connection;
        });
        // The reconciliation transaction has already acquired the contest lock at this point.
        vi.spyOn(runner.manager.getRepository(FileEntity), 'findOne').mockImplementationOnce(async () => {
          reachedFileLookup = true;
          throw new Error('injected reconciliation lookup failure');
        });
        vi.spyOn(runner, 'rollbackTransaction').mockRejectedValueOnce(
          new Error('injected reconciliation rollback failure'),
        );
        return runner;
      });
    try {
      await expect(localFinalization.finalize(uk)).rejects.toBe(failure);
      expect(reachedFileLookup).toBe(true);
      expect(destroySpy).toHaveBeenCalled();
      const [newConnection] = await singleConnectionSource.query('SELECT CONNECTION_ID() AS id');
      expect(newConnection.id).not.toBe(failedConnectionId);
      // A separate pool can immediately lock the contest; no abandoned reconciliation lock remains.
      await expect(
        dataSource.transaction(async (manager) => {
          return manager.getRepository(ContestEntity).findOne({
            where: { id: contestId },
            lock: { mode: 'pessimistic_write', onLocked: 'nowait' },
          });
        }),
      ).resolves.toMatchObject({ status: ContestStatus.Created, srkFileId: null });
      expect(await dataSource.getRepository(FileEntity).countBy({ contestId })).toBe(0);
      expect(removeSpy).not.toHaveBeenCalled();
      await expect(readFile(path.join(storagePath, uploadSpy.mock.calls[0][0].path))).resolves.toBeInstanceOf(Buffer);
    } finally {
      await singleConnectionSource.destroy();
    }
  });

  it('rejects unfinished results without uploading or changing contest status', async () => {
    await append([submission(1, 101)]);
    const uploadSpy = vi.spyOn(provider, 'upload');
    await expect(finalization.finalize(uk)).rejects.toMatchObject({ code: ErrCode.ContestFinalizationIncomplete });
    expect(uploadSpy).not.toHaveBeenCalled();
    expect((await contests.getContest(uk)).status).toBe(ContestStatus.Created);
  });

  it('reads multiple raw event pages and preserves the final accepted result', async () => {
    const events: ContestProducerEventBO[] = [submission(1, 101)];
    for (let eventId = 2; eventId <= 1000; eventId++) {
      events.push({
        eventId,
        type: proto.EventType.SOLUTION_ON_PROGRESS,
        solutionOnProgressData: { solutionId: 101, percentageProgress: 50 },
      });
    }
    await append(events);
    await append([settlement(1001, 101)]);
    await finalization.finalize(uk);
    expect((await readFinalFile()).ranklist.rows[0]).toMatchObject({
      score: { value: 1 },
      statuses: [{ result: 'FB' }, expect.any(Object)],
    });
  });

  it('finalizes an empty-event static import in the same PATCH transaction as metadata and users', async () => {
    const staticFile = await uploadStaticFile();
    const control = await contests.updateContest({
      uk,
      srkFileID: staticFile.id,
      title: { fallback: 'Imported Contest' },
      users: [{ id: 'imported', name: 'Imported User' }],
    });
    expect(control).toMatchObject({ type: 'metadata', contestId });
    expect(await contests.getContest(uk)).toMatchObject({
      status: ContestStatus.Finalized,
      srkFileId: staticFile.id,
      title: { fallback: 'Imported Contest' },
    });
    expect(await contests.findContestUserById(uk, 'imported')).toMatchObject({ name: 'Imported User' });
    expect((await finalization.finalize(uk)).response.srkFileID).toBe(staticFile.id);
    await expect(files.deleteFile(staticFile.id)).rejects.toMatchObject({
      code: ErrCode.FileReferencedByFinalizedContest,
    });
    await expect(contests.updateContest({ uk, srkFileID: null })).rejects.toMatchObject({
      code: ErrCode.ContestFinalized,
    });
    await expect(contests.updateContest({ uk, title: { fallback: 'Changed' } })).rejects.toMatchObject({
      code: ErrCode.ContestFinalized,
    });
    await expect(contests.updateContest({ uk, srkFileID: staticFile.id, name: 'Renamed' })).resolves.toBeUndefined();
    await expect(
      contests.updateContestUser(uk, 'imported', { banned: true, broadcasterToken: 'new-secret' }),
    ).resolves.toBeUndefined();
    await contests.deleteContest(uk);
    await expect(files.deleteFile(staticFile.id)).resolves.toBeUndefined();
  });

  it('rolls back static import status and file association if the same PATCH user replacement fails', async () => {
    const staticFile = await uploadStaticFile();
    interceptNextRunner((runner) => {
      vi.spyOn(runner.manager.getRepository(ContestUserEntity), 'save').mockRejectedValueOnce(
        new Error('injected user write failure'),
      );
    });
    await expect(
      contests.updateContest({
        uk,
        srkFileID: staticFile.id,
        users: [{ id: 'imported', name: 'Imported' }],
      }),
    ).rejects.toBeDefined();
    expect(await contests.getContest(uk)).toMatchObject({ status: ContestStatus.Created, srkFileId: null });
    expect(await contests.findContestUserById(uk, 'alice')).toMatchObject({ name: 'Alice' });
  });

  it('corrects a finalized static archive with a replacement file and complete SRK metadata', async () => {
    const original = await uploadStaticFile();
    await contests.updateContest({ uk, srkFileID: original.id });
    const replacement = await uploadStaticFile();
    const streamBefore = await dataSource.getRepository(ContestEventStreamEntity).findOneByOrFail({ contestId });

    await expect(
      contests.updateContest({
        uk,
        srkFileID: replacement.id,
        name: 'Corrected Contest',
        title: { fallback: 'Corrected title' },
        startAt: '2026-10-26T04:00:00Z',
        duration: [4, 'h'],
        frozenDuration: [30, 'min'],
        banner: 'https://example.invalid/corrected-banner.png',
        refLinks: [{ link: 'https://example.invalid/corrected', title: 'Corrected source' }],
        problems: [{ alias: 'A', title: 'Corrected problem' }],
        markers: [{ id: 'corrected', label: 'Corrected marker', style: 'blue' }],
        series: [{ title: 'Corrected series' }],
        sorter: { algorithm: 'ICPC', config: { penalty: [10, 'min'] } },
        contributors: ['Corrected contributor'],
      }),
    ).resolves.toMatchObject({ type: 'metadata', contestId });

    expect(await contests.getContest(uk)).toMatchObject({
      status: ContestStatus.Finalized,
      srkFileId: replacement.id,
      name: 'Corrected Contest',
      title: { fallback: 'Corrected title' },
      startAt: new Date('2026-10-26T04:00:00Z'),
      durationS: 14400,
      frozenDurationS: 1800,
      banner: 'https://example.invalid/corrected-banner.png',
      refLinks: [{ link: 'https://example.invalid/corrected', title: 'Corrected source' }],
      problems: [{ alias: 'A', title: 'Corrected problem' }],
      markers: [{ id: 'corrected', label: 'Corrected marker', style: 'blue' }],
      series: [{ title: 'Corrected series' }],
      sorter: { algorithm: 'ICPC', config: { penalty: [10, 'min'] } },
      contributors: ['Corrected contributor'],
    });
    expect(await dataSource.getRepository(ContestEventStreamEntity).findOneByOrFail({ contestId })).toEqual(
      streamBefore,
    );
    expect(await contests.findContestUserById(uk, 'alice')).toMatchObject({ name: 'Alice' });
    await expect(files.deleteFile(original.id)).resolves.toBeUndefined();
    await expect(files.deleteFile(replacement.id)).rejects.toMatchObject({
      code: ErrCode.FileReferencedByFinalizedContest,
    });
    const uploadSpy = vi.spyOn(provider, 'upload');
    expect((await finalization.finalize(uk)).response).toEqual({
      uk,
      status: ContestStatus.Finalized,
      srkFileID: replacement.id,
    });
    expect(uploadSpy).not.toHaveBeenCalled();
  });

  it.each(['missing', 'deleted', 'foreign'] as const)(
    'keeps the finalized archive and metadata unchanged when a correction references a %s file',
    async (invalidKind) => {
      const original = await uploadStaticFile();
      await contests.updateContest({ uk, srkFileID: original.id });
      const before = await contests.getContest(uk);
      const streamBefore = await dataSource.getRepository(ContestEventStreamEntity).findOneByOrFail({ contestId });
      let invalidFileId = ids.nextId();
      if (invalidKind === 'deleted') {
        const deleted = await uploadStaticFile();
        await files.deleteFile(deleted.id);
        invalidFileId = deleted.id;
      } else if (invalidKind === 'foreign') {
        const owner = await contests.createContest({
          uk: `foreign-${ids.nextId()}`,
          name: 'Other Contest',
          title: { fallback: 'Other Contest' },
          startAt: '2026-10-26T00:00:00Z',
          duration: [300, 's'],
          problems: [],
          markers: [],
          series: [],
        });
        invalidFileId = (await uploadStaticFile(owner._id)).id;
      }

      await expect(
        contests.updateContest({
          uk,
          srkFileID: invalidFileId,
          name: 'Must not persist',
          title: { fallback: 'Must not persist' },
          duration: [4, 'h'],
          frozenDuration: null,
          problems: [],
          contributors: ['Must not persist'],
        }),
      ).rejects.toMatchObject({ code: ErrCode.FileNotFound });
      expect(await contests.getContest(uk)).toEqual(before);
      expect(await dataSource.getRepository(ContestEventStreamEntity).findOneByOrFail({ contestId })).toEqual(
        streamBefore,
      );
      expect((await finalization.finalize(uk)).response.srkFileID).toBe(original.id);
    },
  );

  it('serializes archive correction against deleting both the replacement and old files', async () => {
    const original = await uploadStaticFile();
    await contests.updateContest({ uk, srkFileID: original.id });
    const replacement = await uploadStaticFile();
    const entered = deferred();
    const release = deferred();
    interceptNextRunner((runner) => {
      const repository = runner.manager.getRepository(FileEntity);
      const find = repository.findOne.bind(repository);
      vi.spyOn(repository, 'findOne').mockImplementationOnce(async (options) => {
        const file = await find(options);
        entered.resolve();
        await release.promise;
        return file;
      });
    });
    const correcting = contests.updateContest({
      uk,
      srkFileID: replacement.id,
      title: { fallback: 'Corrected under lock' },
    });
    await entered.promise;
    let deletionsSettled = false;
    const deleting = Promise.allSettled([files.deleteFile(replacement.id), files.deleteFile(original.id)]).then(
      (outcomes) => {
        deletionsSettled = true;
        return outcomes;
      },
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(deletionsSettled).toBe(false);
    release.resolve();
    await correcting;
    const outcomes = await deleting;
    expect(outcomes[0]).toMatchObject({
      status: 'rejected',
      reason: { code: ErrCode.FileReferencedByFinalizedContest },
    });
    expect(outcomes[1]).toMatchObject({ status: 'fulfilled' });
    expect(await contests.getContest(uk)).toMatchObject({
      status: ContestStatus.Finalized,
      srkFileId: replacement.id,
      title: { fallback: 'Corrected under lock' },
    });
    expect(await files.getFile(replacement.id)).toMatchObject({ id: replacement.id });
    await expect(files.getFile(original.id)).rejects.toMatchObject({ code: ErrCode.FileNotFound });
  });

  it('serializes deleting a file with a static-import PATCH that finalizes its contest', async () => {
    const staticFile = await uploadStaticFile();
    const entered = deferred();
    const release = deferred();
    interceptNextRunner((runner) => {
      const repository = runner.manager.getRepository(FileEntity);
      const find = repository.findOne.bind(repository);
      vi.spyOn(repository, 'findOne').mockImplementationOnce(async (options) => {
        const file = await find(options);
        entered.resolve();
        await release.promise;
        return file;
      });
    });
    const linking = contests.updateContest({ uk, srkFileID: staticFile.id });
    await entered.promise;
    let deletionSettled = false;
    const deleting = Promise.allSettled([files.deleteFile(staticFile.id)]).then((outcome) => {
      deletionSettled = true;
      return outcome[0];
    });
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(deletionSettled).toBe(false);
    release.resolve();
    await linking;
    expect(await deleting).toMatchObject({
      status: 'rejected',
      reason: { code: ErrCode.FileReferencedByFinalizedContest },
    });
    expect(await files.getFile(staticFile.id)).toMatchObject({ id: staticFile.id });
  });

  it('leaves eventful file association active until finalize generates a new authoritative archive', async () => {
    await append([submission(1, 101), settlement(2, 101)]);
    const staticFile = await uploadStaticFile();
    await contests.updateContest({ uk, srkFileID: staticFile.id });
    expect(await contests.getContest(uk)).toMatchObject({ status: ContestStatus.Created, srkFileId: staticFile.id });
    const result = await finalization.finalize(uk);
    expect(result.response.srkFileID).not.toBe(staticFile.id);
    await expect(files.deleteFile(result.response.srkFileID)).rejects.toMatchObject({
      code: ErrCode.FileReferencedByFinalizedContest,
    });
    await expect(files.deleteFile(staticFile.id)).resolves.toBeUndefined();
  });
});

function submission(eventId: number, solutionId: number): ContestProducerEventBO {
  return {
    eventId,
    type: proto.EventType.NEW_SOLUTION,
    newSolutionData: { solutionId, userId: 'alice', problemAlias: 'A', time: { value: '250', unit: proto.TimeUnit.S } },
  };
}

function settlement(eventId: number, solutionId: number): ContestProducerEventBO {
  return {
    eventId,
    type: proto.EventType.SOLUTION_ON_RESULT_SETTLE,
    solutionOnResultSettleData: { solutionId, result: proto.Result.AC, time: { value: '290', unit: proto.TimeUnit.S } },
  };
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function clientFor(source: DataSource): TypeOrmClient {
  const client = { getDataSource: () => source };
  return client as TypeOrmClient;
}
