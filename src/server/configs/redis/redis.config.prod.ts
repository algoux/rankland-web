import { Config } from 'bwcx-ljsm';
import RedisConfig from './redis.config';

@Config(RedisConfig, { when: 'production', override: true })
export default class RedisProdConfig extends RedisConfig {
  public readonly host: string = process.env.REDIS_HOST || '127.0.0.1';
  public readonly port: number = Number(process.env.REDIS_PORT) || 6379;
  public readonly db: number = Number(process.env.REDIS_DB) || 0;
  public readonly password: string = process.env.REDIS_PASS || '';
  public readonly namespace: string = readProductionNamespace();
}

function readProductionNamespace(): string {
  const namespace = process.env.REDIS_NAMESPACE?.trim();
  if (!namespace) {
    throw new Error('REDIS_NAMESPACE is required for production Redis configuration');
  }
  return namespace;
}
