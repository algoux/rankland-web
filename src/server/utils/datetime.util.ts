function pad(value: number, length = 2) {
  return String(value).padStart(length, '0');
}

function assertValidDate(date: Date) {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('Invalid date-time value');
  }
}

const OFFSET_SUFFIX_PATTERN = /(?:z|[+-]\d{2}:?\d{2})$/i;
const OFFSETLESS_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?)?$/;
const EXPLICIT_OFFSET_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?)?(?:z|[+-]\d{2}:?\d{2})$/i;

interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

function readDateTimeParts(match: RegExpExecArray): DateTimeParts {
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4] || 0),
    minute: Number(match[5] || 0),
    second: Number(match[6] || 0),
    millisecond: Number((match[7] || '').padEnd(3, '0').slice(0, 3) || 0),
  };
}

function assertValidDateTimeParts(parts: DateTimeParts, value: string) {
  const monthEnd = new Date(0);
  monthEnd.setUTCFullYear(parts.year, parts.month, 0);
  monthEnd.setUTCHours(0, 0, 0, 0);

  if (
    parts.month < 1 ||
    parts.month > 12 ||
    parts.day < 1 ||
    parts.day > monthEnd.getUTCDate() ||
    parts.hour > 23 ||
    parts.minute > 59 ||
    parts.second > 59
  ) {
    throw new RangeError(`Invalid date-time value: ${value}`);
  }
}

function parseOffsetlessDateTime(value: string, utc: boolean) {
  const match = OFFSETLESS_DATE_TIME_PATTERN.exec(value);
  if (!match) {
    throw new RangeError(`Unsupported offsetless date-time value: ${value}`);
  }

  const parts = readDateTimeParts(match);
  assertValidDateTimeParts(parts, value);

  const date = new Date(0);
  if (utc) {
    date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
    date.setUTCHours(parts.hour, parts.minute, parts.second, parts.millisecond);
  } else {
    date.setFullYear(parts.year, parts.month - 1, parts.day);
    date.setHours(parts.hour, parts.minute, parts.second, parts.millisecond);
  }

  const actualParts: DateTimeParts = utc
    ? {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hour: date.getUTCHours(),
        minute: date.getUTCMinutes(),
        second: date.getUTCSeconds(),
        millisecond: date.getUTCMilliseconds(),
      }
    : {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        second: date.getSeconds(),
        millisecond: date.getMilliseconds(),
      };

  if (Object.keys(parts).some((key) => parts[key as keyof DateTimeParts] !== actualParts[key as keyof DateTimeParts])) {
    throw new RangeError(`Invalid date-time value: ${value}`);
  }

  return date;
}

function parseExplicitOffsetDateTime(value: string) {
  const match = EXPLICIT_OFFSET_DATE_TIME_PATTERN.exec(value);
  if (!match) {
    throw new RangeError(`Unsupported explicitly offset date-time value: ${value}`);
  }
  assertValidDateTimeParts(readDateTimeParts(match), value);

  const normalizedValue = value[10] === ' ' ? `${value.slice(0, 10)}T${value.slice(11)}` : value;
  const date = new Date(normalizedValue);
  assertValidDate(date);
  return date;
}

/**
 * Formats an instant in the Node process timezone for JSON API responses.
 * The explicit offset is calculated for the instant, so DST is respected.
 */
export function formatDateTimeForApi(date: Date): string {
  assertValidDate(date);

  const offsetMinutes = -date.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  const milliseconds = date.getMilliseconds();

  return [
    `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
    milliseconds === 0 ? '' : `.${pad(milliseconds, 3)}`,
    `${offsetSign}${pad(Math.floor(absoluteOffset / 60))}:${pad(absoluteOffset % 60)}`,
  ].join('');
}

/**
 * Normalizes a business/raw-SQL date-time input to an absolute JavaScript Date.
 * Offsetless strings intentionally use the Node process timezone.
 */
export function normalizeDateTimeInput(value: Date | string): Date {
  if (value instanceof Date) {
    assertValidDate(value);
    return new Date(value.getTime());
  }

  return OFFSET_SUFFIX_PATTERN.test(value) ? parseExplicitOffsetDateTime(value) : parseOffsetlessDateTime(value, false);
}

/**
 * Formats a value returned by a raw database query. Offsetless MySQL strings
 * are interpreted using the project's UTC DATETIME wall-clock convention.
 */
export function formatDatabaseDateTimeForApi(value: Date | string | null): string | null {
  if (value === null) {
    return null;
  }

  const date =
    value instanceof Date
      ? value
      : OFFSET_SUFFIX_PATTERN.test(value)
      ? parseExplicitOffsetDateTime(value)
      : parseOffsetlessDateTime(value, true);

  return formatDateTimeForApi(date);
}

function normalizeJsonValue(value: unknown, seen: WeakMap<object, unknown>): unknown {
  if (value instanceof Date) {
    return formatDateTimeForApi(value);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Buffer.isBuffer(value) || typeof (value as { toJSON?: unknown }).toJSON === 'function') {
    return value;
  }

  const existing = seen.get(value);
  if (existing !== undefined) {
    return existing;
  }

  if (Array.isArray(value)) {
    const normalized = new Array(value.length);
    seen.set(value, normalized);
    value.forEach((item, index) => {
      normalized[index] = normalizeJsonValue(item, seen);
    });
    return normalized;
  }

  const normalized: Record<string, unknown> = {};
  seen.set(value, normalized);
  Object.keys(value).forEach((key) => {
    normalized[key] = normalizeJsonValue((value as Record<string, unknown>)[key], seen);
  });
  return normalized;
}

/**
 * Recursively prepares JSON data for the API boundary while respecting
 * values that own their serialization contract (Buffer and custom toJSON).
 */
export function normalizeJsonDatesForApi(value: unknown): unknown {
  return normalizeJsonValue(value, new WeakMap());
}
