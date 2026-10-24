import { lstat, mkdir, unlink, writeFile } from 'fs/promises';
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
    const targetPath = this.resolveTargetPath(input.path);
    try {
      await this.assertNoSymlinks(targetPath);
      await mkdir(path.dirname(targetPath), { recursive: true });
      await writeFile(targetPath, input.body);
    } catch (error) {
      if (error instanceof FileStorageProviderError) throw error;
      throw new FileStorageProviderError(classifyFsError(error), error);
    }
  }

  public async remove(filePath: string): Promise<void> {
    const targetPath = this.resolveTargetPath(filePath);
    try {
      await this.assertNoSymlinks(targetPath);
      await unlink(targetPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return;
      if (error instanceof FileStorageProviderError) throw error;
      throw new FileStorageProviderError(classifyFsError(error), error);
    }
  }

  private resolveTargetPath(filePath: string): string {
    const basePath = path.resolve(this.config.fs.basePath);
    const targetPath = path.resolve(basePath, filePath);
    const relativePath = path.relative(basePath, targetPath);
    if (
      relativePath === '' ||
      relativePath === '..' ||
      relativePath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativePath)
    ) {
      throw new FileStorageProviderError('access_denied', new Error('File path escapes the configured FS base path'));
    }
    return targetPath;
  }

  private async assertNoSymlinks(targetPath: string): Promise<void> {
    const basePath = path.resolve(this.config.fs.basePath);
    let currentPath = basePath;
    for (const segment of path.relative(basePath, targetPath).split(path.sep)) {
      currentPath = path.join(currentPath, segment);
      try {
        if ((await lstat(currentPath)).isSymbolicLink()) {
          throw new FileStorageProviderError('access_denied', new Error('File path traverses a symbolic link'));
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return;
        throw error;
      }
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
