import { Config } from 'bwcx-ljsm';
import path from 'path';

export enum FileProviderKey {
  FS = 'FS',
  TencentCloud = 'TencentCloud',
}

export const DEFAULT_FS_FILE_BASE_URL = '/file/';
export const DEFAULT_TENCENT_CLOUD_FILE_BASE_URL = 'https://cdn.algoux.cn/rankland/file/';

export interface TencentCloudFileConfig {
  secretId: string;
  secretKey: string;
  domain?: string;
  bucket: string;
  region: string;
  basePath: string;
}

export interface FsFileConfig {
  basePath: string;
}

@Config()
export default class FileConfig {
  public readonly provider: FileProviderKey = parseProvider(process.env.FILE_PROVIDER);
  public readonly fileBaseUrl: string =
    process.env.FILE_BASE_URL ||
    (this.provider === FileProviderKey.FS ? DEFAULT_FS_FILE_BASE_URL : DEFAULT_TENCENT_CLOUD_FILE_BASE_URL);

  public readonly tencentCloud: TencentCloudFileConfig = {
    secretId: process.env.COS_SECRET_ID || '',
    secretKey: process.env.COS_SECRET_KEY || '',
    domain: process.env.COS_DOMAIN || undefined,
    bucket: process.env.COS_BUCKET || '',
    region: process.env.COS_REGION || '',
    basePath: process.env.COS_BASE_PATH || 'rankland/file/',
  };

  public readonly fs: FsFileConfig = {
    basePath: process.env.FS_BASE_PATH || path.join(process.cwd(), 'temp/file/'),
  };

  public constructor() {
    if (this.provider === FileProviderKey.TencentCloud) {
      const missingNames = [
        ['COS_SECRET_ID', this.tencentCloud.secretId],
        ['COS_SECRET_KEY', this.tencentCloud.secretKey],
        ['COS_BUCKET', this.tencentCloud.bucket],
        ['COS_REGION', this.tencentCloud.region],
      ]
        .filter(([, value]) => !value)
        .map(([name]) => name);
      if (missingNames.length > 0) {
        throw new Error(`Missing required TencentCloud file configuration: ${missingNames.join(', ')}`);
      }
    }
  }
}

function parseProvider(value: string | undefined): FileProviderKey {
  const provider = value || FileProviderKey.FS;
  if (provider !== FileProviderKey.TencentCloud && provider !== FileProviderKey.FS) {
    throw new Error(`Unsupported file provider: ${provider}`);
  }
  return provider;
}
