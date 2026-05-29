import Long from 'long';
import type { Contest, TimeDuration } from '@algoux/standard-ranklist';

const timeUnitToNanoseconds: Record<string, number> = {
  ms: 1_000_000,
  s: 1_000_000_000,
  min: 60 * 1_000_000_000,
  h: 60 * 60 * 1_000_000_000,
  d: 24 * 60 * 60 * 1_000_000_000,
};

export function srkTimeDurationToNanoseconds(time: TimeDuration | null | undefined): Long | null {
  if (!time) {
    return null;
  }
  const [value, unit] = time;
  const multiplier = timeUnitToNanoseconds[unit];
  if (multiplier === undefined) {
    throw new Error(`Invalid source time unit ${unit}`);
  }
  return Long.fromNumber(Math.round(value * multiplier));
}

export function getFrozenStartNs(contest: Contest | null | undefined): string | null {
  if (!contest) {
    return null;
  }
  const durationNs = srkTimeDurationToNanoseconds(contest.duration);
  const frozenDurationNs = srkTimeDurationToNanoseconds(contest.frozenDuration);
  if (!durationNs || !frozenDurationNs || frozenDurationNs.lte(Long.ZERO)) {
    return null;
  }
  const frozenStartNs = durationNs.sub(frozenDurationNs);
  return (frozenStartNs.lt(Long.ZERO) ? Long.ZERO : frozenStartNs).toString();
}
