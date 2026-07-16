import { Config } from 'bwcx-ljsm';

export const DEFAULT_REDIS_NAMESPACE = 'rankland:local';

@Config()
export default class RedisConfig {
  public readonly host: string = process.env.REDIS_HOST || '127.0.0.1';
  public readonly port: number = Number(process.env.REDIS_PORT) || 6379;
  public readonly db: number = Number(process.env.REDIS_DB) || 0;
  public readonly password: string = process.env.REDIS_PASS || '';
  public readonly namespace: string = process.env.REDIS_NAMESPACE?.trim() || DEFAULT_REDIS_NAMESPACE;
}
