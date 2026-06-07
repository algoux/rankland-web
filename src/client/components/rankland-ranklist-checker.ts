import { createCheckers } from 'ts-interface-checker';
import type * as srk from '@algoux/standard-ranklist';
import srkChecker from '@client/lib/srk-checker/index.d.ti';

const { Ranklist: ranklistChecker } = createCheckers(srkChecker);

export function getLegacyRanklistCheckError(ranklist: srk.Ranklist): string | null {
  try {
    ranklistChecker.check(ranklist);
    return null;
  } catch (error) {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return String(error || 'Unknown srk check error.');
  }
}
