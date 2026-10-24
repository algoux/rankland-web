import { ContestStatus } from '@common/modules/contest/contest-status';
import { getFrozenStartNsFromSeconds } from './contest-time';

export function getContestVisibility(
  durationS: number,
  frozenDurationS: number | null | undefined,
  status: ContestStatus = ContestStatus.Created,
) {
  return {
    frozenStartNs:
      status === ContestStatus.Finalized ? null : getFrozenStartNsFromSeconds(durationS, frozenDurationS ?? null),
    visibilityFingerprint: `duration=${durationS};frozen=${frozenDurationS ?? 'null'};status=${status}`,
  };
}
