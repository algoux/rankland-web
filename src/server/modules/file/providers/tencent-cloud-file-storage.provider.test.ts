import { describe, expect, it, vi } from 'vitest';

import TencentCloudFileStorageProvider, {
  TENCENT_CLOUD_REQUEST_TIMEOUT_MS,
} from './tencent-cloud-file-storage.provider';

const config = {
  tencentCloud: {
    secretId: 'secret-id',
    secretKey: 'secret-key',
    domain: undefined,
    bucket: 'bucket-123',
    region: 'ap-test',
    basePath: 'rankland/file/',
  },
};

describe('TencentCloudFileStorageProvider', () => {
  it('sets a finite request timeout and classifies socket timeouts as unavailable', async () => {
    const provider = new TencentCloudFileStorageProvider(config as any);
    const client = (provider as any).client;
    const timeoutError = { code: 'ESOCKETTIMEDOUT', message: 'socket timed out' };
    client.putObject = vi.fn().mockRejectedValue(timeoutError);

    expect(client.options.Timeout).toBe(TENCENT_CLOUD_REQUEST_TIMEOUT_MS);
    await expect(
      provider.upload({
        path: '123/demo.srk.json',
        body: Buffer.from('{}'),
        contentType: 'application/json',
        size: 2,
      }),
    ).rejects.toMatchObject({ kind: 'unavailable', cause: timeoutError });
  });

  it('deletes the exact object key using the configured bucket and prefix', async () => {
    const provider = new TencentCloudFileStorageProvider(config as any);
    const client = (provider as any).client;
    client.deleteObject = vi.fn().mockResolvedValue({});
    await provider.remove('123/demo.srk.json');
    expect(client.deleteObject).toHaveBeenCalledWith({
      Bucket: 'bucket-123',
      Region: 'ap-test',
      Key: 'rankland/file/123/demo.srk.json',
    });
  });

  it('treats NoSuchKey as successful cleanup', async () => {
    const provider = new TencentCloudFileStorageProvider(config as any);
    (provider as any).client.deleteObject = vi.fn().mockRejectedValue({ code: 'NoSuchKey', statusCode: 404 });
    await expect(provider.remove('123/demo.srk.json')).resolves.toBeUndefined();
  });

  it.each([
    [{ code: 'AccessDenied', statusCode: 403 }, 'access_denied'],
    [{ code: 'ESOCKETTIMEDOUT' }, 'unavailable'],
    [{ code: 'NoSuchBucket', statusCode: 404 }, 'unavailable'],
    [{ code: 'UnrecognizedError', statusCode: 400 }, 'unknown'],
  ])('classifies upload and cleanup failures: %j', async (error, kind) => {
    const provider = new TencentCloudFileStorageProvider(config as any);
    const client = (provider as any).client;
    client.putObject = vi.fn().mockRejectedValue(error);
    client.deleteObject = vi.fn().mockRejectedValue(error);
    await expect(
      provider.upload({ path: '123/demo.srk.json', body: Buffer.from('{}'), contentType: 'application/json', size: 2 }),
    ).rejects.toMatchObject({ kind, cause: error });
    await expect(provider.remove('123/demo.srk.json')).rejects.toMatchObject({ kind, cause: error });
  });

  it('rejects cleanup when storage is not configured', async () => {
    const provider = new TencentCloudFileStorageProvider({
      tencentCloud: { ...config.tencentCloud, bucket: '' },
    } as any);
    const client = (provider as any).client;
    client.deleteObject = vi.fn();
    await expect(provider.remove('123/demo.srk.json')).rejects.toMatchObject({ kind: 'unavailable' });
    expect(client.deleteObject).not.toHaveBeenCalled();
  });
});
