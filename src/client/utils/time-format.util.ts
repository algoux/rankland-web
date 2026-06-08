import type * as srk from '@algoux/standard-ranklist';

const EXPLICIT_NUMERIC_TIMEZONE_REGEXP = /([+-])([01]\d|2[0-3]):?([0-5]\d)$/;

export interface FormattedSrkContestTimeRange {
  startText: string;
  endText: string;
  timezoneSource: 'srk-offset' | 'browser';
  sourceOffset?: string;
}

export function formatSrkTimeDuration(
  time: srk.TimeDuration,
  targetUnit: srk.TimeUnit = 'ms',
  fmt: (num: number) => number = (num) => num,
): number {
  let ms = -1;
  switch (time[1]) {
    case 'ms':
      ms = time[0];
      break;
    case 's':
      ms = time[0] * 1000;
      break;
    case 'min':
      ms = time[0] * 1000 * 60;
      break;
    case 'h':
      ms = time[0] * 1000 * 60 * 60;
      break;
    case 'd':
      ms = time[0] * 1000 * 60 * 60 * 24;
      break;
  }

  switch (targetUnit) {
    case 'ms':
      return ms;
    case 's':
      return fmt(ms / 1000);
    case 'min':
      return fmt(ms / 1000 / 60);
    case 'h':
      return fmt(ms / 1000 / 60 / 60);
    case 'd':
      return fmt(ms / 1000 / 60 / 60 / 24);
  }
}

export function preZeroFill(num: number, size: number): string {
  if (num >= Math.pow(10, size)) {
    return num.toString();
  }
  const str = `${Array(size + 1).join('0')}${num}`;
  return str.slice(str.length - size);
}

function normalizeUtcOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffsetMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absOffsetMinutes / 60);
  const minutes = absOffsetMinutes % 60;
  return `${sign}${preZeroFill(hours, 2)}:${preZeroFill(minutes, 2)}`;
}

function parseExplicitNumericUtcOffset(dateTime: string): number | null {
  const match = dateTime.match(EXPLICIT_NUMERIC_TIMEZONE_REGEXP);
  if (!match) {
    return null;
  }
  const [, sign, hourText, minuteText] = match;
  const offsetMinutes = Number(hourText) * 60 + Number(minuteText);
  return sign === '-' ? -offsetMinutes : offsetMinutes;
}

function formatDateInUtcOffset(ms: number, offsetMinutes: number): string {
  const date = new Date(ms + offsetMinutes * 60_000);
  return [
    date.getUTCFullYear(),
    '-',
    preZeroFill(date.getUTCMonth() + 1, 2),
    '-',
    preZeroFill(date.getUTCDate(), 2),
    ' ',
    preZeroFill(date.getUTCHours(), 2),
    ':',
    preZeroFill(date.getUTCMinutes(), 2),
    ':',
    preZeroFill(date.getUTCSeconds(), 2),
  ].join('');
}

function formatDateInBrowserTimezone(ms: number): string {
  const date = new Date(ms);
  return [
    date.getFullYear(),
    '-',
    preZeroFill(date.getMonth() + 1, 2),
    '-',
    preZeroFill(date.getDate(), 2),
    ' ',
    preZeroFill(date.getHours(), 2),
    ':',
    preZeroFill(date.getMinutes(), 2),
    ':',
    preZeroFill(date.getSeconds(), 2),
  ].join('');
}

export function formatSrkContestTimeRange(
  startAt: srk.Contest['startAt'],
  duration: srk.Contest['duration'],
): FormattedSrkContestTimeRange {
  const startAtMs = new Date(startAt).getTime();
  const durationMs = formatSrkTimeDuration(duration, 'ms');
  const endAtMs = startAtMs + durationMs;
  const offsetMinutes = parseExplicitNumericUtcOffset(startAt);

  if (offsetMinutes !== null) {
    return {
      startText: formatDateInUtcOffset(startAtMs, offsetMinutes),
      endText: `${formatDateInUtcOffset(endAtMs, offsetMinutes)} ${normalizeUtcOffset(offsetMinutes)}`,
      timezoneSource: 'srk-offset',
      sourceOffset: normalizeUtcOffset(offsetMinutes),
    };
  }

  const browserOffsetMinutes = -new Date(startAtMs).getTimezoneOffset();
  return {
    startText: formatDateInBrowserTimezone(startAtMs),
    endText: `${formatDateInBrowserTimezone(endAtMs)} ${normalizeUtcOffset(browserOffsetMinutes)}`,
    timezoneSource: 'browser',
  };
}

export function secToTimeStr(second: number, showDay = false): string {
  let sec = second;
  let d = 0;
  if (showDay) {
    d = Math.floor(sec / 86400);
    sec %= 86400;
  }
  const h = Math.floor(sec / 3600);
  sec %= 3600;
  const m = Math.floor(sec / 60);
  sec %= 60;
  const s = Math.floor(sec);
  const strD = showDay && d >= 1 ? `${d}D ` : '';
  if (sec < 0) {
    return '--';
  }
  return `${strD}${preZeroFill(h, 2)}:${preZeroFill(m, 2)}:${preZeroFill(s, 2)}`;
}
