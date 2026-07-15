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
});
