import { afterEach, describe, expect, it } from 'vitest';

import IdGeneratorConfig from './id-generator.config';

const originalNodeEnv = process.env.NODE_ENV;
const originalWorkerId = process.env.SNOWFLAKE_WORKER_ID;

afterEach(() => {
  restoreEnv('NODE_ENV', originalNodeEnv);
  restoreEnv('SNOWFLAKE_WORKER_ID', originalWorkerId);
});

describe('IdGeneratorConfig', () => {
  it('allows a worker override outside production for isolated tests and tooling', () => {
    process.env.NODE_ENV = 'test';
    process.env.SNOWFLAKE_WORKER_ID = '17';

    expect(new IdGeneratorConfig().workerIdOverride).toBe(17);
  });

  it('rejects a worker override in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.SNOWFLAKE_WORKER_ID = '17';

    expect(() => new IdGeneratorConfig()).toThrow(/must not be set in production/i);
  });
});

function restoreEnv(key: 'NODE_ENV' | 'SNOWFLAKE_WORKER_ID', value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
