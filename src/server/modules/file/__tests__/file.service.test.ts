import { ContestStatus } from '@common/modules/contest/contest-status';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrCode } from '@common/enums/err-code.enum';
import { ContestEntity } from '@server/entities/contest.entity';
import { ContestEventStreamEntity } from '@server/entities/contest-event-stream.entity';
import { FileEntity } from '@server/entities/file.entity';
import FileService from '../file.service';
import { FileStorageProviderError, type FileStorageProvider } from '../providers/file-storage-provider';

const CONTEST_ID = '70346717215600640';
const FILE_ID = '70346717215600641';
const CREATED_AT = new Date('2026-07-15T01:02:03.004Z');
const UPDATED_AT = new Date('2026-07-15T01:02:04.005Z');

describe('FileService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    [
      'demo.srk.json',
      undefined,
      '',
      `${FILE_ID}/demo.srk.json`,
      `https://cdn.algoux.cn/rankland/file/${FILE_ID}/demo.srk.json`,
    ],
    [
      '比赛 demo.srk.json',
      'ranklist',
      'ranklist',
      `${FILE_ID}/比赛 demo.srk.json`,
      `https://cdn.algoux.cn/rankland/file/${FILE_ID}/%E6%AF%94%E8%B5%9B%20demo.srk.json`,
    ],
  ])(
    'uploads the original filename %s before saving its metadata',
    async (filename, category, expectedCategory, expectedPath, expectedUrl) => {
      const harness = createHarness();
      const service = harness.createService();

      const result = await service.uploadFile({
        contestId: CONTEST_ID,
        category,
        file: upload(filename, 'hello'),
      });

      expect(harness.events).toEqual(['upload', 'save']);
      expect(harness.provider.upload).toHaveBeenCalledWith({
        path: expectedPath,
        body: Buffer.from('hello'),
        contentType: 'application/json',
        size: 5,
      });
      expect(harness.fileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: FILE_ID,
          contestId: CONTEST_ID,
          category: expectedCategory,
          name: filename,
          path: expectedPath,
          size: 5,
          hashType: 'sha256',
          hashValue: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
        }),
      );
      expect(result).toMatchObject({
        id: FILE_ID,
        contestId: CONTEST_ID,
        category: expectedCategory,
        name: filename,
        path: expectedPath,
        size: 5,
        hashType: 'sha256',
        hashValue: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
        url: expectedUrl,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    },
  );

  it('rejects uploads for a missing or soft-deleted contest', async () => {
    const harness = createHarness({ contestExists: false });
    const service = harness.createService();

    await expect(
      service.uploadFile({ contestId: CONTEST_ID, file: upload('demo.srk.json', 'hello') }),
    ).rejects.toMatchObject({ code: ErrCode.ContestNotFound });
    expect(harness.provider.upload).not.toHaveBeenCalled();
    expect(harness.fileRepository.save).not.toHaveBeenCalled();
  });

  it('prepares metadata from actual buffer bytes without touching the database or storage', () => {
    const harness = createHarness();
    const file = harness.createService().prepareUpload({
      contestId: CONTEST_ID,
      file: { ...upload('final.srk.json', 'hello'), size: 999 },
    });

    expect(file).toBeInstanceOf(FileEntity);
    expect(file).toMatchObject({
      id: FILE_ID,
      size: 5,
      hashType: 'sha256',
      hashValue: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    });
    expect(harness.dataSource.getRepository).not.toHaveBeenCalled();
    expect(harness.provider.upload).not.toHaveBeenCalled();
  });

  it('rejects invalid upload buffers before preparing metadata', () => {
    const harness = createHarness();
    expect(() =>
      harness.createService().prepareUpload({ contestId: CONTEST_ID, file: { buffer: 'hello' } as any }),
    ).toThrowError(expect.objectContaining({ code: ErrCode.IllegalParameters }));
  });

  it.each([
    ['access_denied', ErrCode.FileUploadAccessDenied],
    ['unavailable', ErrCode.FileUploadUnavailable],
    ['unknown', ErrCode.FileUploadUnknown],
  ] as const)('maps prepared upload failure %s without saving metadata', async (kind, code) => {
    const harness = createHarness();
    harness.provider.upload.mockRejectedValue(new FileStorageProviderError(kind));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(
      harness.createService().uploadPrepared(storedFile(), Buffer.from('hello'), 'application/json'),
    ).rejects.toMatchObject({ code });
    expect(harness.fileRepository.save).not.toHaveBeenCalled();
  });

  it('removes only the prepared object and propagates cleanup errors to the caller', async () => {
    const harness = createHarness();
    const service = harness.createService();
    await service.removeUploaded(storedFile());
    expect(harness.provider.remove).toHaveBeenCalledWith(`${FILE_ID}/demo.srk.json`);
    const error = new FileStorageProviderError('unavailable');
    harness.provider.remove.mockRejectedValue(error);
    await expect(service.removeUploaded(storedFile())).rejects.toBe(error);
    expect(harness.fileRepository.softDelete).not.toHaveBeenCalled();
  });

  it.each(['', 'nested/demo.srk.json', 'nested\\demo.srk.json', 'demo\u0000.srk.json', 'demo\u0007.srk.json'])(
    'rejects the invalid original filename %j',
    async (filename) => {
      const harness = createHarness();
      const service = harness.createService();

      await expect(
        service.uploadFile({ contestId: CONTEST_ID, file: upload(filename, 'hello') }),
      ).rejects.toMatchObject({ code: ErrCode.FileInvalidName });
      expect(harness.provider.upload).not.toHaveBeenCalled();
      expect(harness.fileRepository.save).not.toHaveBeenCalled();
    },
  );

  it('rejects a filename when the composed id/filename path exceeds 256 characters', async () => {
    const harness = createHarness();
    const service = harness.createService();

    await expect(
      service.uploadFile({ contestId: CONTEST_ID, file: upload('a'.repeat(240), 'hello') }),
    ).rejects.toMatchObject({ code: ErrCode.FileInvalidName });
    expect(harness.provider.upload).not.toHaveBeenCalled();
    expect(harness.fileRepository.save).not.toHaveBeenCalled();
  });

  it('does not save metadata when the storage provider rejects the upload', async () => {
    const harness = createHarness();
    harness.provider.upload.mockRejectedValue(new FileStorageProviderError('unknown', new Error('provider failed')));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const service = harness.createService();

    await expect(
      service.uploadFile({ contestId: CONTEST_ID, file: upload('demo.srk.json', 'hello') }),
    ).rejects.toMatchObject({ code: ErrCode.FileUploadUnknown });
    expect(harness.fileRepository.save).not.toHaveBeenCalled();
  });

  it('gets and soft-deletes a file by its Snowflake id', async () => {
    const harness = createHarness({ existingFile: storedFile() });
    const service = harness.createService();

    const file = await service.getFile(FILE_ID);
    expect(file).toMatchObject({ id: FILE_ID, name: 'demo.srk.json' });
    expect(file).not.toHaveProperty('deletedAt');
    await service.deleteFile(FILE_ID);
    await expect(service.getFile(FILE_ID)).rejects.toMatchObject({ code: ErrCode.FileNotFound });
    expect(harness.fileRepository.softDelete).toHaveBeenCalledWith({ id: FILE_ID });
    expect(harness.events).toEqual(['transaction', 'contest-lock', 'stream-lock', 'file-lock']);
  });

  it('protects a final file referenced by an undeleted finalized contest', async () => {
    const harness = createHarness({
      existingFile: storedFile(),
      contest: { status: ContestStatus.Finalized, srkFileId: FILE_ID, deletedAt: null },
    });
    await expect(harness.createService().deleteFile(FILE_ID)).rejects.toMatchObject({
      code: ErrCode.FileReferencedByFinalizedContest,
    });
    expect(harness.fileRepository.softDelete).not.toHaveBeenCalled();
    expect(harness.events).toEqual(['transaction', 'contest-lock', 'stream-lock', 'file-lock']);
  });

  it.each([
    { status: ContestStatus.Finalized, srkFileId: FILE_ID, deletedAt: new Date() },
    { status: ContestStatus.Finalized, srkFileId: 'another-file', deletedAt: null },
    { status: ContestStatus.Created, srkFileId: FILE_ID, deletedAt: null },
  ] as const)('allows deleting a file without a live finalized reference: %j', async (contest) => {
    const harness = createHarness({ existingFile: storedFile(), contest });
    await harness.createService().deleteFile(FILE_ID);
    expect(harness.fileRepository.softDelete).toHaveBeenCalledWith({ id: FILE_ID });
  });

  it('rechecks the file after acquiring transaction locks', async () => {
    const harness = createHarness({ existingFile: storedFile() });
    harness.fileRepository.findOne.mockResolvedValueOnce(storedFile()).mockResolvedValueOnce(null);
    await expect(harness.createService().deleteFile(FILE_ID)).rejects.toMatchObject({ code: ErrCode.FileNotFound });
    expect(harness.fileRepository.softDelete).not.toHaveBeenCalled();
  });
});

function upload(originalname: string, contents: string) {
  const buffer = Buffer.from(contents);
  return {
    fieldname: 'file',
    originalname,
    encoding: '7bit',
    mimetype: 'application/json',
    size: buffer.length,
    buffer,
  };
}

function storedFile(): FileEntity {
  return Object.assign(new FileEntity(), {
    id: FILE_ID,
    contestId: CONTEST_ID,
    category: 'ranklist',
    name: 'demo.srk.json',
    path: `${FILE_ID}/demo.srk.json`,
    size: 5,
    hashType: 'sha256',
    hashValue: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    deletedAt: null,
  });
}

function createHarness(
  options: { existingFile?: FileEntity; contestExists?: boolean; contest?: Partial<ContestEntity> } = {},
) {
  const events: string[] = [];
  let existingFile = options.existingFile;
  const provider: FileStorageProvider & { upload: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> } = {
    upload: vi.fn(async () => {
      events.push('upload');
    }),
    remove: vi.fn(async () => undefined),
  };
  const fileRepository = {
    create: vi.fn((input) => Object.assign(new FileEntity(), input)),
    save: vi.fn(async (entity: FileEntity) => {
      events.push('save');
      entity.createdAt = CREATED_AT;
      entity.updatedAt = UPDATED_AT;
      existingFile = entity;
      return entity;
    }),
    findOne: vi.fn(async ({ where, lock }: any) => {
      if (lock) events.push('file-lock');
      return existingFile?.id === where.id && existingFile.deletedAt === null ? existingFile : null;
    }),
    softDelete: vi.fn(async ({ id }: { id: string }) => {
      if (existingFile?.id === id) {
        existingFile.deletedAt = new Date();
        return { affected: 1 };
      }
      return { affected: 0 };
    }),
  };
  const contestRepository = {
    findOne: vi.fn(async ({ lock }: any) => {
      if (lock) events.push('contest-lock');
      return options.contestExists === false
        ? null
        : Object.assign(new ContestEntity(), { id: CONTEST_ID, status: ContestStatus.Created, ...options.contest });
    }),
  };
  const streamRepository = {
    findOne: vi.fn(async ({ lock }: any) => {
      if (lock) events.push('stream-lock');
      return Object.assign(new ContestEventStreamEntity(), { contestId: CONTEST_ID });
    }),
  };
  const dataSource = {
    getRepository: vi.fn((target) => {
      if (target === FileEntity) return fileRepository;
      if (target === ContestEntity) return contestRepository;
      if (target === ContestEventStreamEntity) return streamRepository;
      throw new Error(`Unexpected repository ${String(target)}`);
    }),
    transaction: vi.fn(async (run: (manager: any) => Promise<any>) => {
      events.push('transaction');
      return run({ getRepository: dataSource.getRepository });
    }),
  };

  return {
    events,
    provider,
    fileRepository,
    dataSource,
    createService() {
      return new FileService(
        { getDataSource: () => dataSource } as any,
        { nextId: () => FILE_ID } as any,
        {
          fileBaseUrl: 'https://cdn.algoux.cn/rankland/file/',
        } as any,
        { resolve: () => provider } as any,
      );
    },
  };
}
