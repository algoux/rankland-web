import { Config } from 'bwcx-ljsm';

const MAX_COALESCE_WINDOW_MS = 250;
const MAX_FANOUT_SHARDS = 64;
const MAX_FANOUT_WINDOW_MS = 250;
const MAX_TWO_CYCLE_CONVERGENCE_MS = 500;

@Config()
export default class ContestEventNotificationConfig {
  public readonly coalesceWindowMs = parseBoundedNonNegativeInteger(
    'CONTEST_EVENT_NOTIFICATION_COALESCE_WINDOW_MS',
    25,
    MAX_COALESCE_WINDOW_MS,
  );
  public readonly fanoutShards = parseBoundedPositiveInteger(
    'CONTEST_EVENT_NOTIFICATION_FANOUT_SHARDS',
    32,
    MAX_FANOUT_SHARDS,
  );
  public readonly fanoutWindowMs = parseBoundedNonNegativeInteger(
    'CONTEST_EVENT_NOTIFICATION_FANOUT_WINDOW_MS',
    200,
    MAX_FANOUT_WINDOW_MS,
  );
  public readonly summaryIntervalMs = parseBoundedPositiveInteger(
    'CONTEST_EVENT_NOTIFICATION_SUMMARY_INTERVAL_MS',
    60_000,
    60 * 60 * 1_000,
  );

  public constructor() {
    if (this.coalesceWindowMs + 2 * this.fanoutWindowMs > MAX_TWO_CYCLE_CONVERGENCE_MS) {
      throw new RangeError('contest event notification coalesce plus two fanout windows must not exceed 500ms');
    }
  }
}

function parseBoundedPositiveInteger(name: string, fallback: number, maximum: number): number {
  const value = parseInteger(name, fallback);
  if (value < 1 || value > maximum) {
    throw new RangeError(`${name} must be an integer between 1 and ${maximum}`);
  }
  return value;
}

function parseBoundedNonNegativeInteger(name: string, fallback: number, maximum: number): number {
  const value = parseInteger(name, fallback);
  if (value < 0 || value > maximum) {
    throw new RangeError(`${name} must be an integer between 0 and ${maximum}`);
  }
  return value;
}

function parseInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${name} must be a safe integer`);
  }
  return value;
}
