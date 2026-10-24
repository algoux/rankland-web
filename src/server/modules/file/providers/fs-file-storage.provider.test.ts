import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'fs/promises';
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
    await provider.remove('70346717215600641/比赛 demo.srk.json');
    await expect(readFile(path.join(testBasePath, '70346717215600641/比赛 demo.srk.json'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(provider.remove('70346717215600641/比赛 demo.srk.json')).resolves.toBeUndefined();
  });

  it.each(['', '.', '..', '../outside.srk.json', 'nested/../../outside.srk.json'])(
    'rejects upload and cleanup outside the storage root: %j',
    async (filePath) => {
      testBasePath = await mkdtemp(path.join(tmpdir(), 'rankland-file-provider-'));
      const provider = new FsFileStorageProvider({ fs: { basePath: testBasePath } } as any);
      await expect(
        provider.upload({ path: filePath, body: Buffer.from('{}'), contentType: 'application/json', size: 2 }),
      ).rejects.toMatchObject({ kind: 'access_denied' });
      await expect(provider.remove(filePath)).rejects.toMatchObject({ kind: 'access_denied' });
    },
  );

  it('rejects a path through symlinks without modifying its target', async () => {
    testBasePath = await mkdtemp(path.join(tmpdir(), 'rankland-file-provider-'));
    await mkdir(path.join(testBasePath, 'storage'));
    await mkdir(path.join(testBasePath, 'outside'));
    await writeFile(path.join(testBasePath, 'outside', 'keep.json'), 'keep');
    await symlink(path.join(testBasePath, 'outside'), path.join(testBasePath, 'storage', 'linked'));
    const provider = new FsFileStorageProvider({ fs: { basePath: path.join(testBasePath, 'storage') } } as any);

    await expect(provider.remove('linked/keep.json')).rejects.toMatchObject({ kind: 'access_denied' });
    await expect(
      provider.upload({ path: 'linked/keep.json', body: Buffer.from('{}'), contentType: 'application/json', size: 2 }),
    ).rejects.toMatchObject({ kind: 'access_denied' });
    await expect(readFile(path.join(testBasePath, 'outside', 'keep.json'), 'utf8')).resolves.toBe('keep');
  });

  it('classifies write and unlink failures instead of removing directories recursively', async () => {
    testBasePath = await mkdtemp(path.join(tmpdir(), 'rankland-file-provider-'));
    await mkdir(path.join(testBasePath, 'directory'));
    await writeFile(path.join(testBasePath, 'directory', 'keep'), 'keep');
    const provider = new FsFileStorageProvider({ fs: { basePath: testBasePath } } as any);
    await expect(
      provider.upload({ path: 'directory', body: Buffer.from('{}'), contentType: 'application/json', size: 2 }),
    ).rejects.toMatchObject({ kind: 'unknown' });
    await expect(provider.remove('directory')).rejects.toMatchObject({
      kind: expect.stringMatching(/unknown|access_denied/),
    });
    await expect(readFile(path.join(testBasePath, 'directory', 'keep'), 'utf8')).resolves.toBe('keep');
  });
});
