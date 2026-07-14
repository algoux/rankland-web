import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import {
  formatDatabaseDateTimeForApi,
  formatDateTimeForApi,
  normalizeDateTimeInput,
  normalizeJsonDatesForApi,
} from '../datetime.util';

function formatInTimezone(timezone: string, isoString: string) {
  const moduleUrl = pathToFileURL(resolve(__dirname, '../datetime.util.ts')).href;
  const script = `
    import * as datetime from ${JSON.stringify(moduleUrl)};
    const formatDateTimeForApi = datetime.formatDateTimeForApi ?? datetime.default.formatDateTimeForApi;
    process.stdout.write(formatDateTimeForApi(new Date(${JSON.stringify(isoString)})));
  `;

  return execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '--eval', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, TZ: timezone },
  });
}

function normalizeInTimezone(timezone: string, value: string) {
  const moduleUrl = pathToFileURL(resolve(__dirname, '../datetime.util.ts')).href;
  const script = `
    import * as datetime from ${JSON.stringify(moduleUrl)};
    const normalizeDateTimeInput = datetime.normalizeDateTimeInput ?? datetime.default.normalizeDateTimeInput;
    process.stdout.write(normalizeDateTimeInput(${JSON.stringify(value)}).toISOString());
  `;

  return execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '--eval', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, TZ: timezone },
  });
}

function formatDatabaseValueInTimezone(timezone: string, value: string) {
  const moduleUrl = pathToFileURL(resolve(__dirname, '../datetime.util.ts')).href;
  const script = `
    import * as datetime from ${JSON.stringify(moduleUrl)};
    const formatDatabaseDateTimeForApi = datetime.formatDatabaseDateTimeForApi
      ?? datetime.default.formatDatabaseDateTimeForApi;
    process.stdout.write(formatDatabaseDateTimeForApi(${JSON.stringify(value)}));
  `;

  return execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '--eval', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, TZ: timezone },
  });
}

function normalizeJsonInTimezone(timezone: string) {
  const moduleUrl = pathToFileURL(resolve(__dirname, '../datetime.util.ts')).href;
  const script = `
    import * as datetime from ${JSON.stringify(moduleUrl)};
    const normalizeJsonDatesForApi = datetime.normalizeJsonDatesForApi
      ?? datetime.default.normalizeJsonDatesForApi;
    const buffer = Buffer.from([1, 2]);
    const custom = {
      date: new Date('2026-01-01T00:00:00.000Z'),
      toJSON() { return { serializedByCustomObject: true }; },
    };
    const input = {
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      nested: [new Date('2026-01-01T00:00:00.123Z'), { updatedAt: new Date('2026-07-01T00:00:00.000Z') }],
      text: '2026-01-01T00:00:00.000Z',
      buffer,
      custom,
    };
    const output = normalizeJsonDatesForApi(input);
    process.stdout.write(JSON.stringify({
      output,
      inputDateUnchanged: input.createdAt instanceof Date,
      inputObjectUnchanged: output !== input,
      bufferUnchanged: output.buffer === buffer,
      customUnchanged: output.custom === custom,
    }));
  `;

  return JSON.parse(
    execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '--eval', script], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, TZ: timezone },
    }),
  );
}

describe('formatDateTimeForApi', () => {
  it('renders UTC with an explicit offset and omits zero milliseconds', () => {
    expect(formatInTimezone('UTC', '2026-01-01T00:00:00.000Z')).toBe('2026-01-01T00:00:00+00:00');
  });

  it('preserves non-zero milliseconds', () => {
    expect(formatInTimezone('UTC', '2026-01-01T00:00:00.123Z')).toBe('2026-01-01T00:00:00.123+00:00');
  });

  it('renders the same instant in the server timezone', () => {
    expect(formatInTimezone('Asia/Shanghai', '2026-01-01T00:00:00.000Z')).toBe('2026-01-01T08:00:00+08:00');
  });

  it('uses the offset effective at the instant across daylight-saving changes', () => {
    expect(formatInTimezone('America/New_York', '2026-01-01T00:00:00.000Z')).toBe('2025-12-31T19:00:00-05:00');
    expect(formatInTimezone('America/New_York', '2026-07-01T00:00:00.000Z')).toBe('2026-06-30T20:00:00-04:00');
  });
});

describe('normalizeDateTimeInput', () => {
  it('preserves the instant represented by a Date or an explicitly offset string', () => {
    const instant = new Date('2026-01-01T00:00:00.123Z');

    expect(normalizeDateTimeInput(instant)).not.toBe(instant);
    expect(normalizeDateTimeInput(instant).toISOString()).toBe('2026-01-01T00:00:00.123Z');
    expect(normalizeDateTimeInput('2026-01-01T00:00:00.123Z').toISOString()).toBe('2026-01-01T00:00:00.123Z');
    expect(normalizeDateTimeInput('2026-01-01T08:00:00.123+08:00').toISOString()).toBe('2026-01-01T00:00:00.123Z');
    expect(normalizeDateTimeInput('2026-01-01T08:00:00.123+0800').toISOString()).toBe('2026-01-01T00:00:00.123Z');
  });

  it('interprets an offsetless string in the Node process timezone', () => {
    expect(normalizeInTimezone('Asia/Shanghai', '2026-01-01 00:00:00.123456')).toBe('2025-12-31T16:00:00.123Z');
    expect(normalizeInTimezone('America/New_York', '2026-01-01T00:00:00')).toBe('2026-01-01T05:00:00.000Z');
  });

  it('rejects invalid or unsupported input instead of silently normalizing it', () => {
    expect(() => normalizeDateTimeInput('2026-02-30 00:00:00')).toThrow(RangeError);
    expect(() => normalizeDateTimeInput('2026-02-30T00:00:00Z')).toThrow(RangeError);
    expect(() => normalizeDateTimeInput('2026-02-30T08:00:00+08:00')).toThrow(RangeError);
    expect(() => normalizeDateTimeInput('not a date')).toThrow(RangeError);
    expect(() => normalizeDateTimeInput(new Date(Number.NaN))).toThrow(RangeError);
  });
});

describe('formatDatabaseDateTimeForApi', () => {
  it('treats an offsetless raw MySQL DATETIME string as a UTC wall-clock value', () => {
    expect(formatDatabaseValueInTimezone('Asia/Shanghai', '2026-01-01 00:00:00.000000')).toBe(
      '2026-01-01T08:00:00+08:00',
    );
  });

  it('respects an explicit offset and accepts Date and null values', () => {
    expect(formatDatabaseValueInTimezone('Asia/Shanghai', '2026-01-01T08:00:00+08:00')).toBe(
      '2026-01-01T08:00:00+08:00',
    );
    expect(formatDatabaseDateTimeForApi(new Date('2026-01-01T00:00:00Z'))).toBe(
      formatDateTimeForApi(new Date('2026-01-01T00:00:00Z')),
    );
    expect(formatDatabaseDateTimeForApi(null)).toBeNull();
  });

  it('rejects an invalid explicitly offset database value', () => {
    expect(() => formatDatabaseDateTimeForApi('2026-02-30T00:00:00Z')).toThrow(RangeError);
  });
});

describe('normalizeJsonDatesForApi', () => {
  it('recursively formats real Dates without mutating the input JSON graph', () => {
    const result = normalizeJsonInTimezone('Asia/Shanghai');

    expect(result).toEqual({
      output: {
        createdAt: '2026-01-01T08:00:00+08:00',
        nested: ['2026-01-01T08:00:00.123+08:00', { updatedAt: '2026-07-01T08:00:00+08:00' }],
        text: '2026-01-01T00:00:00.000Z',
        buffer: { type: 'Buffer', data: [1, 2] },
        custom: { serializedByCustomObject: true },
      },
      inputDateUnchanged: true,
      inputObjectUnchanged: true,
      bufferUnchanged: true,
      customUnchanged: true,
    });
  });

  it('leaves primitive values unchanged', () => {
    expect(normalizeJsonDatesForApi(null)).toBeNull();
    expect(normalizeJsonDatesForApi(undefined)).toBeUndefined();
    expect(normalizeJsonDatesForApi('2026-01-01T00:00:00.000Z')).toBe('2026-01-01T00:00:00.000Z');
    expect(normalizeJsonDatesForApi(42)).toBe(42);
  });

  it('preserves sparse array positions while normalizing present Dates', () => {
    const date = new Date('2026-01-01T00:00:00.000Z');
    const sparse = new Array(3);
    sparse[1] = date;

    const result = normalizeJsonDatesForApi(sparse) as unknown[];

    expect(result).toHaveLength(3);
    expect(0 in result).toBe(false);
    expect(result[1]).toBe(formatDateTimeForApi(date));
    expect(2 in result).toBe(false);
  });
});
