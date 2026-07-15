import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrCode } from '@common/enums/err-code.enum';
import { ContestEntity } from '@server/entities/contest.entity';
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

function createHarness(options: { existingFile?: FileEntity; contestExists?: boolean } = {}) {
  const events: string[] = [];
  let existingFile = options.existingFile;
  const provider: FileStorageProvider & { upload: ReturnType<typeof vi.fn> } = {
    upload: vi.fn(async () => {
      events.push('upload');
    }),
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
    findOne: vi.fn(async ({ where }: any) => {
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
    findOne: vi.fn(async () =>
      options.contestExists === false ? null : Object.assign(new ContestEntity(), { id: CONTEST_ID }),
    ),
  };
  const dataSource = {
    getRepository: vi.fn((target) => {
      if (target === FileEntity) return fileRepository;
      if (target === ContestEntity) return contestRepository;
      throw new Error(`Unexpected repository ${String(target)}`);
    }),
  };

  return {
    events,
    provider,
    fileRepository,
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
