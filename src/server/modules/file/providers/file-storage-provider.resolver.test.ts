import { describe, expect, it } from 'vitest';

import { FileProviderKey } from '@server/configs/file/file.config';
import FileStorageProviderResolver from './file-storage-provider.resolver';

describe('FileStorageProviderResolver', () => {
  it('resolves the configured FS provider', () => {
    const fsProvider = { upload: async () => undefined };
    const resolver = new FileStorageProviderResolver(
      { provider: FileProviderKey.FS } as any,
      { upload: async () => undefined } as any,
      fsProvider as any,
    );

    expect(resolver.resolve()).toBe(fsProvider);
  });
});
