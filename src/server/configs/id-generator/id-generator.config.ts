import { Config } from 'bwcx-ljsm';

@Config()
export default class IdGeneratorConfig {
  public readonly workerIdOverride = parseWorkerIdOverride(process.env.SNOWFLAKE_WORKER_ID);
}

function parseWorkerIdOverride(rawValue: string | undefined): number | undefined {
  if (rawValue === undefined || rawValue.trim() === '') {
    return undefined;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new RangeError('SNOWFLAKE_WORKER_ID must not be set in production');
  }

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < 0 || value > 1023) {
    throw new RangeError('SNOWFLAKE_WORKER_ID must be an integer between 0 and 1023');
  }
  return value;
}
