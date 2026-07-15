import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import FileConfig, { FileProviderKey } from './file.config';

const ENV_NAMES = [
  'FILE_PROVIDER',
  'FILE_BASE_URL',
  'COS_SECRET_ID',
  'COS_SECRET_KEY',
  'COS_DOMAIN',
  'COS_BUCKET',
  'COS_REGION',
  'COS_BASE_PATH',
  'FS_BASE_PATH',
] as const;
const originalEnv = Object.fromEntries(ENV_NAMES.map((name) => [name, process.env[name]]));

beforeEach(() => {
  for (const name of ENV_NAMES) delete process.env[name];
});

afterEach(() => {
  for (const name of ENV_NAMES) {
    const value = originalEnv[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

describe('FileConfig', () => {
  it('uses the FS provider and nested provider defaults', () => {
    expect(new FileConfig()).toMatchObject({
      provider: FileProviderKey.FS,
      fileBaseUrl: '/file/',
      tencentCloud: {
        secretId: '',
        secretKey: '',
        domain: undefined,
        bucket: '',
        region: '',
        basePath: 'rankland/file/',
      },
      fs: {
        basePath: path.join(process.cwd(), 'temp/file/'),
      },
    });
  });

  it('reads file and provider overrides from the environment', () => {
    Object.assign(process.env, {
      FILE_PROVIDER: 'TencentCloud',
      FILE_BASE_URL: 'https://files.example.test/',
      COS_SECRET_ID: 'secret-id',
      COS_SECRET_KEY: 'secret-key',
      COS_DOMAIN: 'cos.example.test',
      COS_BUCKET: 'bucket-123',
      COS_REGION: 'ap-test',
      COS_BASE_PATH: 'custom/files/',
      FS_BASE_PATH: '/tmp/rankland-files/',
    });

    expect(new FileConfig()).toMatchObject({
      provider: FileProviderKey.TencentCloud,
      fileBaseUrl: 'https://files.example.test/',
      tencentCloud: {
        secretId: 'secret-id',
        secretKey: 'secret-key',
        domain: 'cos.example.test',
        bucket: 'bucket-123',
        region: 'ap-test',
        basePath: 'custom/files/',
      },
      fs: {
        basePath: '/tmp/rankland-files/',
      },
    });
  });

  it('fails fast when TencentCloud is selected without its required settings', () => {
    process.env.FILE_PROVIDER = 'TencentCloud';

    expect(() => new FileConfig()).toThrow(/COS_SECRET_ID, COS_SECRET_KEY, COS_BUCKET, COS_REGION/);
  });

  it('uses the TencentCloud CDN URL when that provider is selected without a URL override', () => {
    Object.assign(process.env, {
      FILE_PROVIDER: 'TencentCloud',
      COS_SECRET_ID: 'secret-id',
      COS_SECRET_KEY: 'secret-key',
      COS_BUCKET: 'bucket-123',
      COS_REGION: 'ap-test',
    });

    expect(new FileConfig().fileBaseUrl).toBe('https://cdn.algoux.cn/rankland/file/');
  });

  it('rejects unsupported provider keys', () => {
    process.env.FILE_PROVIDER = 'unknown';

    expect(() => new FileConfig()).toThrow(/Unsupported file provider: unknown/);
  });
});
