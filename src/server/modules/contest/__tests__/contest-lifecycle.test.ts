import { describe, expect, it, vi } from 'vitest';
import { ErrCode } from '@common/enums/err-code.enum';
import { ContestStatus } from '@common/modules/contest/contest-status';
import type TypeOrmClient from '@server/database/typeorm-client';
import { ContestEntity } from '@server/entities/contest.entity';
import { ContestEventStreamEntity } from '@server/entities/contest-event-stream.entity';
import { ContestUserEntity } from '@server/entities/contest-user.entity';
import { FileEntity } from '@server/entities/file.entity';
import ContestService from '../contest.service';

const CONTEST_ID = '100';
const FILE_ID = '200';
const REPLACEMENT_FILE_ID = '201';
const USER_ID = '300';

function harness(options: { status?: ContestStatus; lastEventId?: number; missingContest?: boolean; missingStream?: boolean } = {}) {
  const calls: string[] = [];
  const contest = {
    id: CONTEST_ID,
    uk: 'contest-a',
    name: 'Contest A',
    title: { fallback: 'Contest A' },
    status: options.status ?? ContestStatus.Created,
    durationS: 18000,
    frozenDurationS: 3600,
    srkFileId: options.status === ContestStatus.Finalized ? FILE_ID : null,
    startAt: new Date('2026-10-24T00:00:00Z'),
    createdAt: new Date('2026-10-24T00:00:00Z'),
    updatedAt: new Date('2026-10-24T00:00:00Z'),
    deletedAt: null,
  };
  const stream = {
    contestId: CONTEST_ID,
    lastEventId: options.lastEventId ?? 0,
    streamRevision: 1,
    producerId: 'producer-a',
    producerLockedAt: new Date('2026-10-24T00:00:00Z'),
  };
  const user = { id: USER_ID, contestId: CONTEST_ID, userId: 'alice', name: 'Alice', sortIndex: 0 };
  const contestRepository = {
    findOne: vi.fn(async (query: any) => {
      calls.push(query.lock ? 'contest:lock' : 'contest:read');
      if (query.where.uk === 'new-contest') return null;
      if (query.where.uk === 'target') return { id: 'other', uk: 'target' };
      return options.missingContest ? null : { ...contest };
    }),
    find: vi.fn(async () => [{ ...contest }]),
    create: vi.fn((input) => ({ ...input })),
    save: vi.fn(async (input) => { calls.push('contest:save'); return input; }),
    update: vi.fn(async () => { calls.push('contest:update'); return { affected: 1 }; }),
    softDelete: vi.fn(async () => ({ affected: 1 })),
  };
  const streamRepository = {
    findOne: vi.fn(async () => { calls.push('stream:lock'); return options.missingStream ? null : { ...stream }; }),
    create: vi.fn((input) => ({ ...input })),
    save: vi.fn(async (input) => { calls.push('stream:save'); return input; }),
  };
  const userRepository = {
    findOne: vi.fn(async () => { calls.push('user:read'); return { ...user }; }),
    find: vi.fn(async () => { calls.push('user:list'); return [{ ...user }]; }),
    create: vi.fn((input) => ({ ...input })),
    save: vi.fn(async (input) => { calls.push('user:save'); return input; }),
    update: vi.fn(async () => { calls.push('user:update'); return { affected: 1 }; }),
    delete: vi.fn(async () => { calls.push('user:delete'); return { affected: 1 }; }),
  };
  const fileRepository = {
    findOne: vi.fn(async (query: any) => [FILE_ID, REPLACEMENT_FILE_ID].includes(query.where.id)
      ? { id: query.where.id, contestId: CONTEST_ID } : null),
  };
  const manager = {
    getRepository: (target: unknown) => {
      if (target === ContestEntity) return contestRepository;
      if (target === ContestEventStreamEntity) return streamRepository;
      if (target === ContestUserEntity) return userRepository;
      if (target === FileEntity) return fileRepository;
      throw new Error('Unexpected repository');
    },
  };
  const transaction = vi.fn(async (callback: (manager: any) => Promise<unknown>) => {
    calls.push('transaction:start');
    try {
      const result = await callback(manager);
      calls.push('transaction:commit');
      return result;
    } catch (error) {
      calls.push('transaction:rollback');
      throw error;
    }
  });
  const typeOrmClient = { getDataSource: () => ({ ...manager, transaction }) } as unknown as TypeOrmClient;
  const service = new ContestService(typeOrmClient, { nextId: () => '900' });
  return { service, calls, contestRepository, streamRepository, userRepository, fileRepository, transaction };
}

describe('ContestService lifecycle', () => {
  it('creates new contests with Created status without an associated SRK file', async () => {
    const { service, contestRepository } = harness();
    await service.createContest({
      uk: 'new-contest',
      name: 'New Contest',
      title: { fallback: 'New Contest' },
      startAt: '2026-10-24T00:00:00Z',
      duration: [5, 'h'],
      problems: [],
      markers: [],
      series: [],
    });
    expect(contestRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: ContestStatus.Created, srkFileId: null }));
  });

  it('finalizes an empty stream when its static SRK file is associated and invalidates visibility', async () => {
    const { service, contestRepository, calls } = harness();
    await expect(service.updateContest({ uk: 'contest-a', srkFileID: FILE_ID })).resolves.toEqual({
      type: 'metadata',
      contestId: CONTEST_ID,
      canonicalUk: 'contest-a',
      visibilityFingerprint: 'duration=18000;frozen=3600;status=99',
    });
    expect(contestRepository.update).toHaveBeenCalledWith({ id: CONTEST_ID }, {
      srkFileId: FILE_ID,
      status: ContestStatus.Finalized,
    });
    expect(calls).toEqual(['transaction:start', 'contest:lock', 'stream:lock', 'contest:update', 'transaction:commit']);
  });

  it('uses the committed timing metadata in the finalization fingerprint', async () => {
    const { service } = harness();
    await expect(service.updateContest({
      uk: 'contest-a', srkFileID: FILE_ID, duration: [4, 'h'], frozenDuration: null,
    })).resolves.toMatchObject({ visibilityFingerprint: 'duration=14400;frozen=null;status=99' });
  });

  it('does not finalize an event-bearing stream when a file is associated', async () => {
    const { service, contestRepository } = harness({ lastEventId: 2 });
    await expect(service.updateContest({ uk: 'contest-a', srkFileID: FILE_ID })).resolves.toBeUndefined();
    expect(contestRepository.update).toHaveBeenCalledWith({ id: CONTEST_ID }, { srkFileId: FILE_ID });
  });

  it('keeps an active contest active when a file association is cleared', async () => {
    const { service, contestRepository } = harness();
    await expect(service.updateContest({ uk: 'contest-a', srkFileID: null })).resolves.toBeUndefined();
    expect(contestRepository.update).toHaveBeenCalledWith({ id: CONTEST_ID }, { srkFileId: null });
  });

  it('allows idempotent association of the same file on a finalized contest', async () => {
    const { service, fileRepository } = harness({ status: ContestStatus.Finalized });
    await expect(service.updateContest({ uk: 'contest-a', srkFileID: FILE_ID })).resolves.toBeUndefined();
    expect(fileRepository.findOne).toHaveBeenCalledWith({ where: { id: FILE_ID } });
  });

  it.each([FILE_ID, REPLACEMENT_FILE_ID])('accepts archived SRK corrections from sync with file %s', async (srkFileID) => {
    const { service, contestRepository, userRepository, streamRepository } = harness({
      status: ContestStatus.Finalized, lastEventId: 2,
    });
    // srk-collection/scripts/sync.js sends the whole SRK metadata, even when reusing its file.
    await expect(service.updateContest({
      uk: 'contest-a', name: 'Corrected Contest', title: { fallback: 'Corrected Contest' },
      startAt: '2026-10-26T00:00:00Z', duration: [4, 'h'], frozenDuration: null,
      banner: null, refLinks: null, problems: [{ alias: 'A' }], markers: [], series: [],
      sorter: { algorithm: 'ICPC', config: {} }, contributors: [], srkFileID,
    })).resolves.toMatchObject({ visibilityFingerprint: 'duration=14400;frozen=null;status=99' });
    expect(contestRepository.update).toHaveBeenCalledWith({ id: CONTEST_ID }, expect.objectContaining({
      srkFileId: srkFileID, title: { fallback: 'Corrected Contest' }, durationS: 14400,
    }));
    expect(contestRepository.update.mock.calls[0][1]).not.toHaveProperty('status', ContestStatus.Created);
    expect(userRepository.save).not.toHaveBeenCalled();
    expect(userRepository.delete).not.toHaveBeenCalled();
    expect(streamRepository.save).not.toHaveBeenCalled();
  });

  it('allows finalized contest administrative name and redirect changes', async () => {
    const { service, contestRepository } = harness({ status: ContestStatus.Finalized });
    await service.updateContest({ uk: 'contest-a', name: 'Renamed', redirectUK: 'target' });
    expect(contestRepository.update).toHaveBeenCalledWith({ id: CONTEST_ID }, { name: 'Renamed', redirectUk: 'target' });
    await service.updateContest({ uk: 'contest-a', redirectUK: null });
    expect(contestRepository.update).toHaveBeenLastCalledWith({ id: CONTEST_ID }, { redirectUk: null });
  });

  it.each([
    { title: { fallback: 'Changed' } },
    { startAt: '2026-10-25T00:00:00Z' },
    { duration: [4, 'h'] },
    { frozenDuration: null },
    { banner: null },
    { refLinks: null },
    { problems: [] },
    { markers: [] },
    { series: [] },
    { sorter: null },
    { contributors: [] },
    { users: [] },
    { users: null },
    { srkFileID: null },
  ])('rejects finalized ranklist metadata changes: %j', async (change) => {
    const { service, contestRepository, userRepository } = harness({ status: ContestStatus.Finalized });
    await expect(service.updateContest({ uk: 'contest-a', name: 'Renamed', ...change } as any))
      .rejects.toMatchObject({ code: ErrCode.ContestFinalized });
    expect(contestRepository.update).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
    expect(userRepository.delete).not.toHaveBeenCalled();
  });

  it.each([0, 2])('allows replacing only the finalized file with %i current events', async (lastEventId) => {
    const { service, contestRepository, streamRepository } = harness({ status: ContestStatus.Finalized, lastEventId });
    await expect(service.updateContest({ uk: 'contest-a', srkFileID: REPLACEMENT_FILE_ID })).resolves.toBeUndefined();
    expect(contestRepository.update).toHaveBeenCalledWith({ id: CONTEST_ID }, {
      srkFileId: REPLACEMENT_FILE_ID,
      ...(lastEventId === 0 ? { status: ContestStatus.Finalized } : {}),
    });
    expect(streamRepository.save).not.toHaveBeenCalled();
  });

  it.each([null, { id: REPLACEMENT_FILE_ID, contestId: 'another-contest' }])(
    'rejects invalid or foreign archive replacements before applying metadata: %j', async (file) => {
      const { service, fileRepository, contestRepository } = harness({ status: ContestStatus.Finalized });
      fileRepository.findOne.mockResolvedValueOnce(file);
      await expect(service.updateContest({
        uk: 'contest-a', srkFileID: REPLACEMENT_FILE_ID, title: { fallback: 'Corrected' },
      })).rejects.toMatchObject({ code: ErrCode.FileNotFound });
      expect(contestRepository.update).not.toHaveBeenCalled();
    },
  );

  it.each([[], null])('does not allow archive replacement to overwrite contest users: %j', async (users) => {
    const { service, contestRepository, userRepository } = harness({ status: ContestStatus.Finalized });
    await expect(service.updateContest({ uk: 'contest-a', srkFileID: REPLACEMENT_FILE_ID, users }))
      .rejects.toMatchObject({ code: ErrCode.ContestFinalized });
    expect(contestRepository.update).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
    expect(userRepository.delete).not.toHaveBeenCalled();
  });

  it('rejects reset after finalization without changing the stream', async () => {
    const { service, streamRepository } = harness({ status: ContestStatus.Finalized, lastEventId: 10 });
    await expect(service.dropEvents('contest-a')).rejects.toMatchObject({ code: ErrCode.ContestFinalized });
    expect(streamRepository.save).not.toHaveBeenCalled();
  });

  it('preserves stream-reset behavior for an active contest', async () => {
    const { service, streamRepository } = harness({ lastEventId: 10 });
    await expect(service.dropEvents('contest-a')).resolves.toMatchObject({ latestEventId: 0, streamRevision: 2 });
    expect(streamRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      lastEventId: 0, streamRevision: 2, producerId: null, producerLockedAt: null,
    }));
  });

  it.each(['upsert', 'replace', 'single'] as const)('locks contest then stream before %s user writes', async (operation) => {
    const { service, calls, contestRepository, streamRepository } = harness();
    if (operation === 'upsert') await service.upsertContestUsers(CONTEST_ID, [{ id: 'alice', name: 'Updated' }]);
    if (operation === 'replace') await service.replaceContestUsers(CONTEST_ID, [{ id: 'alice', name: 'Updated' }]);
    if (operation === 'single') await service.updateContestUser('contest-a', 'alice', { name: 'Updated' });
    expect(calls.slice(0, 3)).toEqual(['transaction:start', 'contest:lock', 'stream:lock']);
    expect(calls[calls.length - 1]).toBe('transaction:commit');
    expect(contestRepository.findOne).toHaveBeenCalledWith(expect.objectContaining({ lock: { mode: 'pessimistic_write' } }));
    expect(streamRepository.findOne).toHaveBeenCalledWith({ where: { contestId: CONTEST_ID }, lock: { mode: 'pessimistic_write' } });
    expect(calls).toContain(operation === 'single' ? 'user:update' : 'user:save');
  });

  it.each(['upsert', 'replace'] as const)('rejects finalized bulk user %s', async (operation) => {
    const { service, userRepository } = harness({ status: ContestStatus.Finalized });
    const result = operation === 'upsert'
      ? service.upsertContestUsers(CONTEST_ID, [{ id: 'alice', name: 'Updated' }])
      : service.replaceContestUsers(CONTEST_ID, []);
    await expect(result).rejects.toMatchObject({ code: ErrCode.ContestFinalized });
    expect(userRepository.find).not.toHaveBeenCalled();
    expect(userRepository.findOne).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
    expect(userRepository.delete).not.toHaveBeenCalled();
  });

  it('permits finalized user moderation fields within the same locks', async () => {
    const { service, calls, userRepository } = harness({ status: ContestStatus.Finalized });
    await service.updateContestUser('contest-a', 'alice', { banned: true, broadcasterToken: 'new-token' });
    expect(calls).toEqual(['transaction:start', 'contest:lock', 'stream:lock', 'user:read', 'user:update', 'transaction:commit']);
    expect(userRepository.update).toHaveBeenCalledWith({ id: USER_ID }, { banned: true, broadcasterToken: 'new-token' });
  });

  it.each([
    { name: 'Renamed' }, { official: false }, { avatar: null }, { photo: null }, { organization: null },
    { location: null }, { teamMembers: [] }, { markers: [] }, { index: 1 },
  ])('rejects finalized user ranklist changes: %j', async (change) => {
    const { service, userRepository } = harness({ status: ContestStatus.Finalized });
    await expect(service.updateContestUser('contest-a', 'alice', { banned: true, ...change }))
      .rejects.toMatchObject({ code: ErrCode.ContestFinalized });
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it.each(['missingContest', 'missingStream'] as const)('rejects bulk writes when %s', async (missing) => {
    const { service, userRepository } = harness({ [missing]: true });
    await expect(service.upsertContestUsers(CONTEST_ID, [])).rejects.toMatchObject({ code: ErrCode.ContestNotFound });
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it.each([[ContestStatus.Created, 0], [ContestStatus.Finalized, 99]] as const)('exposes numeric status %s in public and admin detail and summary metadata', async (status, numericStatus) => {
    const { service } = harness({ status });
    for (const admin of [false, true]) {
      const detail = JSON.parse(JSON.stringify(await service.getContestWithUsers('contest-a', admin)));
      const summary = JSON.parse(JSON.stringify(await service.listContests(admin)));
      expect(detail).toMatchObject({ status: numericStatus });
      expect(summary).toMatchObject({ contests: [{ status: numericStatus }] });
      expect(typeof detail.status).toBe('number');
      expect(typeof summary.contests[0].status).toBe('number');
    }
  });
});
