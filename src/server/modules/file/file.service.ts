import { ContestStatus } from '@common/modules/contest/contest-status';
import { createHash } from 'crypto';
import { Inject, Provide } from 'bwcx-core';
import type { DataSource } from 'typeorm';

import { ErrCode } from '@common/enums/err-code.enum';
import type { FileRespDTO } from '@common/modules/file/file.dto';
import FileConfig from '@server/configs/file/file.config';
import TypeOrmClient from '@server/database/typeorm-client';
import { ContestEntity } from '@server/entities/contest.entity';
import { ContestEventStreamEntity } from '@server/entities/contest-event-stream.entity';
import { FileEntity } from '@server/entities/file.entity';
import LogicException from '@server/exceptions/logic.exception';
import IdGeneratorService, { type IdGenerator } from '@server/services/id-generator.service';
import { formatDateTimeForApi } from '@server/utils/datetime.util';
import { FileStorageProviderError } from './providers/file-storage-provider';
import FileStorageProviderResolver from './providers/file-storage-provider.resolver';

interface UploadedFile {
  originalname: string;
  mimetype?: string;
  size: number;
  buffer: Buffer;
}

export interface UploadFileInput {
  contestId: string;
  category?: string;
  file: UploadedFile;
}

@Provide()
export default class FileService {
  public constructor(
    @Inject(TypeOrmClient) private readonly typeOrmClient: TypeOrmClient,
    @Inject(IdGeneratorService) private readonly idGenerator: IdGenerator,
    @Inject(FileConfig) private readonly config: FileConfig,
    @Inject(FileStorageProviderResolver) private readonly providerResolver: FileStorageProviderResolver,
  ) {}

  private get dataSource(): DataSource {
    return this.typeOrmClient.getDataSource();
  }

  public async uploadFile(input: UploadFileInput): Promise<FileRespDTO> {
    const contest = await this.dataSource.getRepository(ContestEntity).findOne({
      where: { id: input.contestId },
    });
    if (!contest) {
      throw new LogicException(ErrCode.ContestNotFound);
    }

    const file = this.prepareUpload(input);
    await this.uploadPrepared(file, input.file.buffer, input.file.mimetype || 'application/octet-stream');

    try {
      return this.toResponse(await this.dataSource.getRepository(FileEntity).save(file));
    } catch (error) {
      console.error('[FileService] metadata save failed after storage upload', {
        fileId: file.id,
        contestId: file.contestId,
        path: file.path,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new LogicException(ErrCode.FileUploadUnknown);
    }
  }

  public prepareUpload(input: UploadFileInput): FileEntity {
    if (!input.file || !Buffer.isBuffer(input.file.buffer)) {
      throw new LogicException(ErrCode.IllegalParameters);
    }

    const id = this.idGenerator.nextId();
    const name = input.file.originalname;
    const path = buildFilePath(id, name);
    const hashValue = createHash('sha256').update(input.file.buffer).digest('hex');
    return Object.assign(new FileEntity(), {
      id,
      contestId: input.contestId,
      category: input.category ?? '',
      name,
      path,
      size: input.file.buffer.length,
      hashType: 'sha256',
      hashValue,
    });
  }

  public async uploadPrepared(file: FileEntity, buffer: Buffer, contentType: string): Promise<void> {
    try {
      await this.providerResolver.resolve().upload({
        path: file.path,
        body: buffer,
        contentType,
        size: buffer.length,
      });
    } catch (error) {
      this.logUploadFailure(file, error);
      throw new LogicException(mapProviderErrorCode(error));
    }
  }

  public async removeUploaded(file: FileEntity): Promise<void> {
    await this.providerResolver.resolve().remove(file.path);
  }

  public async getFile(id: string): Promise<FileRespDTO> {
    return this.toResponse(await this.findFile(id));
  }

  public async deleteFile(id: string): Promise<void> {
    // Only discover ownership here; re-read under locks before mutating metadata.
    const candidate = await this.findFile(id);
    await this.dataSource.transaction(async (manager) => {
      const contest = await manager.getRepository(ContestEntity).findOne({
        where: { id: candidate.contestId },
        withDeleted: true,
        lock: { mode: 'pessimistic_write' },
      });
      await manager.getRepository(ContestEventStreamEntity).findOne({
        where: { contestId: candidate.contestId },
        lock: { mode: 'pessimistic_write' },
      });
      const repository = manager.getRepository(FileEntity);
      const file = await repository.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!file) {
        throw new LogicException(ErrCode.FileNotFound);
      }
      if (
        contest &&
        !contest.deletedAt &&
        contest.status === ContestStatus.Finalized &&
        contest.srkFileId === file.id
      ) {
        throw new LogicException(ErrCode.FileReferencedByFinalizedContest);
      }
      await repository.softDelete({ id: file.id });
    });
  }

  private async findFile(id: string): Promise<FileEntity> {
    const file = await this.dataSource.getRepository(FileEntity).findOne({ where: { id } });
    if (!file) {
      throw new LogicException(ErrCode.FileNotFound);
    }
    return file;
  }

  private toResponse(file: FileEntity): FileRespDTO {
    return {
      id: file.id,
      contestId: file.contestId,
      category: file.category,
      name: file.name,
      path: file.path,
      size: file.size,
      hashType: file.hashType,
      hashValue: file.hashValue,
      url: joinDownloadUrl(this.config.fileBaseUrl, file.path),
      createdAt: formatDateTimeForApi(file.createdAt),
      updatedAt: formatDateTimeForApi(file.updatedAt),
    };
  }

  private logUploadFailure(file: FileEntity, error: unknown): void {
    const cause = error instanceof FileStorageProviderError ? error.cause : error;
    const detail = cause as { code?: string; statusCode?: number; message?: string } | undefined;
    console.error('[FileService] storage upload failed', {
      fileId: file.id,
      contestId: file.contestId,
      path: file.path,
      kind: error instanceof FileStorageProviderError ? error.kind : 'unknown',
      code: detail?.code,
      statusCode: detail?.statusCode,
      message: detail?.message || (cause instanceof Error ? cause.message : String(cause)),
    });
  }
}

export function buildFilePath(id: string, originalFilename: string): string {
  if (
    typeof originalFilename !== 'string' ||
    originalFilename.length === 0 ||
    originalFilename === '.' ||
    originalFilename === '..' ||
    /[\p{Cc}/\\]/u.test(originalFilename) ||
    characterLength(originalFilename) > 256
  ) {
    throw new LogicException(ErrCode.FileInvalidName);
  }

  const path = `${id}/${originalFilename}`;
  if (characterLength(path) > 256) {
    throw new LogicException(ErrCode.FileInvalidName);
  }
  return path;
}

export function joinDownloadUrl(fileBaseUrl: string, path: string): string {
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${fileBaseUrl.replace(/\/+$/, '')}/${encodedPath}`;
}

function characterLength(value: string): number {
  return Array.from(value).length;
}

function mapProviderErrorCode(error: unknown): ErrCode {
  if (!(error instanceof FileStorageProviderError)) {
    return ErrCode.FileUploadUnknown;
  }
  switch (error.kind) {
    case 'access_denied':
      return ErrCode.FileUploadAccessDenied;
    case 'unavailable':
      return ErrCode.FileUploadUnavailable;
    default:
      return ErrCode.FileUploadUnknown;
  }
}
