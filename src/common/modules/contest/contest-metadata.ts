import type * as srk from '@algoux/standard-ranklist';

export const MAX_CONTEST_DURATION_SECONDS = 0xffff_ffff;

const secondsByUnit = {
  s: 1,
  min: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
} as const;

export function isI18NStringSet(value: unknown): value is srk.I18NStringSet {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  return (
    typeof (value as Record<string, unknown>).fallback === 'string' &&
    ((value as Record<string, string>).fallback as string).trim().length > 0 &&
    entries.every(([, item]) => typeof item === 'string')
  );
}

export function contestDurationToSeconds(value: unknown): number {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new RangeError('Contest duration must be a [value, unit] tuple');
  }
  const [amount, unit] = value;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
    throw new RangeError('Contest duration value must be a non-negative finite number');
  }
  const multiplier = secondsByUnit[unit as keyof typeof secondsByUnit];
  if (multiplier === undefined) {
    throw new RangeError(`Contest duration unit ${String(unit)} is not supported`);
  }
  const seconds = amount * multiplier;
  if (!Number.isInteger(seconds) || seconds > MAX_CONTEST_DURATION_SECONDS) {
    throw new RangeError('Contest duration must resolve to a whole number of seconds');
  }
  return seconds;
}

export function contestSecondsToDuration(seconds: number): srk.TimeDuration {
  return [seconds, 's'];
}
