import { afterEach, describe, expect, it } from 'vitest';
import ContestEventNotificationConfig from './contest-event-notification.config';

const keys = [
  'CONTEST_EVENT_NOTIFICATION_COALESCE_WINDOW_MS',
  'CONTEST_EVENT_NOTIFICATION_FANOUT_SHARDS',
  'CONTEST_EVENT_NOTIFICATION_FANOUT_WINDOW_MS',
  'CONTEST_EVENT_NOTIFICATION_SUMMARY_INTERVAL_MS',
] as const;
const original = new Map(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    const value = original.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('ContestEventNotificationConfig', () => {
  it('defaults to the load-tested single-instance fanout profile', () => {
    for (const key of keys) delete process.env[key];

    expect(new ContestEventNotificationConfig()).toMatchObject({
      coalesceWindowMs: 25,
      fanoutShards: 32,
      fanoutWindowMs: 200,
      summaryIntervalMs: 60_000,
    });
  });

  it('parses the bounded fanout experiment configuration', () => {
    process.env.CONTEST_EVENT_NOTIFICATION_COALESCE_WINDOW_MS = '25';
    process.env.CONTEST_EVENT_NOTIFICATION_FANOUT_SHARDS = '8';
    process.env.CONTEST_EVENT_NOTIFICATION_FANOUT_WINDOW_MS = '100';
    process.env.CONTEST_EVENT_NOTIFICATION_SUMMARY_INTERVAL_MS = '1000';

    expect(new ContestEventNotificationConfig()).toMatchObject({
      coalesceWindowMs: 25,
      fanoutShards: 8,
      fanoutWindowMs: 100,
      summaryIntervalMs: 1_000,
    });
  });

  it.each([
    ['CONTEST_EVENT_NOTIFICATION_COALESCE_WINDOW_MS', '251'],
    ['CONTEST_EVENT_NOTIFICATION_FANOUT_SHARDS', '65'],
    ['CONTEST_EVENT_NOTIFICATION_FANOUT_WINDOW_MS', '251'],
  ])('rejects an unsafe %s value', (name, value) => {
    for (const key of keys) delete process.env[key];
    process.env[name] = value;

    expect(() => new ContestEventNotificationConfig()).toThrow(new RegExp(name));
  });

  it('rejects a two-cycle convergence budget above 500ms', () => {
    process.env.CONTEST_EVENT_NOTIFICATION_COALESCE_WINDOW_MS = '100';
    process.env.CONTEST_EVENT_NOTIFICATION_FANOUT_WINDOW_MS = '201';

    expect(() => new ContestEventNotificationConfig()).toThrow(/500ms/i);
  });
});
