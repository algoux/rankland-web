import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';

import FsFileStorageProvider from './fs-file-storage.provider';

let testBasePath: string | undefined;

afterEach(async () => {
  if (testBasePath) {
    await rm(testBasePath, { recursive: true, force: true });
    testBasePath = undefined;
  }
});

describe('FsFileStorageProvider', () => {
  it('writes the uploaded buffer below the configured base path', async () => {
    testBasePath = await mkdtemp(path.join(tmpdir(), 'rankland-file-provider-'));
    const provider = new FsFileStorageProvider({ fs: { basePath: testBasePath } } as any);
    const body = Buffer.from('{"ranklist":true}');

    await provider.upload({
      path: '70346717215600641/比赛 demo.srk.json',
      body,
      contentType: 'application/json',
      size: body.length,
    });

    await expect(readFile(path.join(testBasePath, '70346717215600641/比赛 demo.srk.json'))).resolves.toEqual(body);
  });
});
