import type * as srk from '@algoux/standard-ranklist';
import { isBeforeContestFreeze } from '@algoux/standard-ranklist-renderer-component-core';

interface CCPC26DisplayTime {
  isLive: boolean;
  timeTravelTime: number | null;
  now: number;
}

export function isCCPC26Ranklist(ranklist: srk.Ranklist): boolean {
  return (
    ranklist.sorter?.algorithm === 'ICPC' &&
    !!ranklist.sorter.config?.extendedAlgorithms?.some((item) => item.algorithm === 'CCPC26')
  );
}

/** Replay takes precedence over the Live clock, including elapsed time zero. */
export function shouldEnableCCPC26(ranklist: srk.Ranklist, time: CCPC26DisplayTime): boolean {
  if (!isCCPC26Ranklist(ranklist)) return false;
  const elapsed = time.timeTravelTime ?? (time.isLive ? time.now - Date.parse(ranklist.contest.startAt) : null);
  return isBeforeContestFreeze(ranklist.contest, elapsed);
}
