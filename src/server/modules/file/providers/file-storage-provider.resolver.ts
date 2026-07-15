import { Inject, Provide } from 'bwcx-core';

import FileConfig, { FileProviderKey } from '@server/configs/file/file.config';
import type { FileStorageProvider } from './file-storage-provider';
import FsFileStorageProvider from './fs-file-storage.provider';
import TencentCloudFileStorageProvider from './tencent-cloud-file-storage.provider';

@Provide()
export default class FileStorageProviderResolver {
  public constructor(
    @Inject(FileConfig) private readonly config: FileConfig,
    @Inject(TencentCloudFileStorageProvider)
    private readonly tencentCloudProvider: TencentCloudFileStorageProvider,
    @Inject(FsFileStorageProvider)
    private readonly fsProvider: FsFileStorageProvider,
  ) {}

  public resolve(): FileStorageProvider {
    switch (this.config.provider) {
      case FileProviderKey.TencentCloud:
        return this.tencentCloudProvider;
      case FileProviderKey.FS:
        return this.fsProvider;
      default:
        throw new Error(`Unsupported file provider: ${this.config.provider}`);
    }
  }
}
