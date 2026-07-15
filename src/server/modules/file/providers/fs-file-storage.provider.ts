import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { Inject, Provide } from 'bwcx-core';

import FileConfig from '@server/configs/file/file.config';
import {
  FileStorageProviderError,
  type FileStorageProvider,
  type FileStorageProviderErrorKind,
  type FileStorageUploadInput,
} from './file-storage-provider';

const ACCESS_DENIED_CODES = new Set(['EACCES', 'EPERM']);
const UNAVAILABLE_CODES = new Set(['EBUSY', 'EMFILE', 'ENFILE', 'ENOSPC', 'EROFS']);

@Provide()
export default class FsFileStorageProvider implements FileStorageProvider {
  public constructor(@Inject(FileConfig) private readonly config: FileConfig) {}

  public async upload(input: FileStorageUploadInput): Promise<void> {
    const basePath = path.resolve(this.config.fs.basePath);
    const targetPath = path.resolve(basePath, input.path);
    const relativePath = path.relative(basePath, targetPath);
    if (
      relativePath === '' ||
      relativePath === '..' ||
      relativePath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativePath)
    ) {
      throw new FileStorageProviderError('access_denied', new Error('File path escapes the configured FS base path'));
    }

    try {
      await mkdir(path.dirname(targetPath), { recursive: true });
      await writeFile(targetPath, input.body);
    } catch (error) {
      throw new FileStorageProviderError(classifyFsError(error), error);
    }
  }
}

function classifyFsError(error: unknown): FileStorageProviderErrorKind {
  const code = (error as NodeJS.ErrnoException | undefined)?.code;
  if (code && ACCESS_DENIED_CODES.has(code)) {
    return 'access_denied';
  }
  if (code && UNAVAILABLE_CODES.has(code)) {
    return 'unavailable';
  }
  return 'unknown';
}
