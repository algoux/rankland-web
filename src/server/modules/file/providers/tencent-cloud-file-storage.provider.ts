import { Inject, Provide } from 'bwcx-core';
import COS from 'cos-nodejs-sdk-v5';

import FileConfig from '@server/configs/file/file.config';
import {
  FileStorageProviderError,
  type FileStorageProvider,
  type FileStorageProviderErrorKind,
  type FileStorageUploadInput,
} from './file-storage-provider';

const ACCESS_DENIED_CODES = new Set([
  'AccessDenied',
  'InvalidAccessKeyId',
  'InvalidSecretId',
  'InvalidSignature',
  'SignatureDoesNotMatch',
]);
const UNAVAILABLE_CODES = new Set([
  'EAI_AGAIN',
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'ESOCKETTIMEDOUT',
  'ETIMEDOUT',
  'InternalError',
  'NoSuchBucket',
  'RequestTimeout',
  'ServiceUnavailable',
]);
export const TENCENT_CLOUD_REQUEST_TIMEOUT_MS = 30_000;

@Provide()
export default class TencentCloudFileStorageProvider implements FileStorageProvider {
  private readonly client: COS;

  public constructor(@Inject(FileConfig) private readonly config: FileConfig) {
    const { tencentCloud } = config;
    this.client = new COS({
      SecretId: tencentCloud.secretId,
      SecretKey: tencentCloud.secretKey,
      Timeout: TENCENT_CLOUD_REQUEST_TIMEOUT_MS,
      ...(tencentCloud.domain ? { Domain: tencentCloud.domain } : {}),
    });
  }

  public async upload(input: FileStorageUploadInput): Promise<void> {
    const { tencentCloud } = this.config;
    if (!tencentCloud.secretId || !tencentCloud.secretKey || !tencentCloud.bucket || !tencentCloud.region) {
      throw new FileStorageProviderError('unavailable', new Error('TencentCloud file storage is not configured'));
    }

    try {
      await this.client.putObject({
        Bucket: tencentCloud.bucket,
        Region: tencentCloud.region,
        Key: joinObjectPath(tencentCloud.basePath, input.path),
        Body: input.body,
        ContentLength: input.size,
        ContentType: input.contentType,
      });
    } catch (error) {
      throw new FileStorageProviderError(classifyTencentCloudError(error), error);
    }
  }
}

export function joinObjectPath(basePath: string, path: string): string {
  return [basePath.replace(/^\/+|\/+$/g, ''), path.replace(/^\/+/, '')].filter(Boolean).join('/');
}

function classifyTencentCloudError(error: unknown): FileStorageProviderErrorKind {
  const candidate = error as { code?: string; statusCode?: number } | undefined;
  if (candidate?.code && ACCESS_DENIED_CODES.has(candidate.code)) {
    return 'access_denied';
  }
  if (candidate?.statusCode === 401 || candidate?.statusCode === 403) {
    return 'access_denied';
  }
  if (
    (candidate?.code && UNAVAILABLE_CODES.has(candidate.code)) ||
    (typeof candidate?.statusCode === 'number' && candidate.statusCode >= 500)
  ) {
    return 'unavailable';
  }
  return 'unknown';
}
