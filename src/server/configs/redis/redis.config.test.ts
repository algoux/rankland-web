import { describe, expect, it } from 'vitest';
import RedisConfig from './redis.config';
import RedisProdConfig from './redis.config.prod';

describe('RedisConfig', () => {
  it('uses local Redis defaults', () => {
    withRedisEnv({}, () => {
      const config = new RedisConfig();

      expect(config.host).toBe('127.0.0.1');
      expect(config.port).toBe(6379);
      expect(config.db).toBe(0);
      expect(config.password).toBe('');
      expect(config.namespace).toBe('rankland:local');
    });
  });

  it('uses the local namespace default when a non-production override is blank', () => {
    withRedisEnv({ REDIS_NAMESPACE: '   ' }, () => {
      expect(new RedisConfig().namespace).toBe('rankland:local');
    });
  });

  it('reads Redis settings from environment variables', () => {
    withRedisEnv(
      {
        REDIS_HOST: 'redis.internal',
        REDIS_PORT: '6380',
        REDIS_DB: '2',
        REDIS_PASS: 'secret',
        REDIS_NAMESPACE: ' rankland:staging ',
      },
      () => {
        const baseConfig = new RedisConfig();
        const config = new RedisProdConfig();

        expect(baseConfig.host).toBe('redis.internal');
        expect(baseConfig.port).toBe(6380);
        expect(baseConfig.db).toBe(2);
        expect(baseConfig.password).toBe('secret');
        expect(baseConfig.namespace).toBe('rankland:staging');
        expect(config.host).toBe('redis.internal');
        expect(config.port).toBe(6380);
        expect(config.db).toBe(2);
        expect(config.password).toBe('secret');
        expect(config.namespace).toBe('rankland:staging');
      },
    );
  });

  it.each([undefined, '', '   '])('requires a non-blank namespace in production: %j', (namespace) => {
    expectProductionNamespaceError(namespace);
  });
});

function expectProductionNamespaceError(namespace: string | undefined) {
  withRedisEnv(namespace === undefined ? {} : { REDIS_NAMESPACE: namespace }, () => {
    expect(() => new RedisProdConfig()).toThrow(/REDIS_NAMESPACE.*required.*production/i);
  });
}

function withRedisEnv(env: Record<string, string>, fn: () => void) {
  const prev = {
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_DB: process.env.REDIS_DB,
    REDIS_PASS: process.env.REDIS_PASS,
    REDIS_NAMESPACE: process.env.REDIS_NAMESPACE,
  };
  for (const key of Object.keys(prev)) {
    delete process.env[key];
  }
  Object.assign(process.env, env);

  try {
    fn();
  } finally {
    for (const [key, value] of Object.entries(prev)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}
