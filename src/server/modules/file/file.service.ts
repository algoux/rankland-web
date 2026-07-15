import { createHash } from 'crypto';
import { Inject, Provide } from 'bwcx-core';
import type { DataSource } from 'typeorm';

import { ErrCode } from '@common/enums/err-code.enum';
import type { FileRespDTO } from '@common/modules/file/file.dto';
import FileConfig from '@server/configs/file/file.config';
import TypeOrmClient from '@server/database/typeorm-client';
import { ContestEntity } from '@server/entities/contest.entity';
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

interface UploadFileInput {
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

    if (!input.file || !Buffer.isBuffer(input.file.buffer)) {
      throw new LogicException(ErrCode.IllegalParameters);
    }

    const id = this.idGenerator.nextId();
    const name = input.file.originalname;
    const path = buildFilePath(id, name);
    const hashValue = createHash('sha256').update(input.file.buffer).digest('hex');
    const fileRepository = this.dataSource.getRepository(FileEntity);
    const file = fileRepository.create({
      id,
      contestId: input.contestId,
      category: input.category ?? '',
      name,
      path,
      size: input.file.size,
      hashType: 'sha256',
      hashValue,
    });

    try {
      await this.providerResolver.resolve().upload({
        path,
        body: input.file.buffer,
        contentType: input.file.mimetype || 'application/octet-stream',
        size: input.file.size,
      });
    } catch (error) {
      this.logUploadFailure(file, error);
      throw new LogicException(mapProviderErrorCode(error));
    }

    try {
      return this.toResponse(await fileRepository.save(file));
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

  public async getFile(id: string): Promise<FileRespDTO> {
    return this.toResponse(await this.findFile(id));
  }

  public async deleteFile(id: string): Promise<void> {
    const file = await this.findFile(id);
    await this.dataSource.getRepository(FileEntity).softDelete({ id: file.id });
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
