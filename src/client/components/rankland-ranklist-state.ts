import type * as srk from '@algoux/standard-ranklist';
import type { StaticRanklist } from '@algoux/standard-ranklist-utils';
import { convertToStaticRanklist } from '@algoux/standard-ranklist-renderer-component-core';

export type RanklandRanklistState =
  | {
      kind: 'ready';
      staticRanklist: StaticRanklist;
    }
  | {
      kind: 'error';
      message: string;
    };

function normalizeRenderError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error || 'Unknown renderer error.');
}

export function createRanklandRanklistState(ranklist: srk.Ranklist): RanklandRanklistState {
  try {
    return {
      kind: 'ready',
      staticRanklist: convertToStaticRanklist(ranklist),
    };
  } catch (error) {
    return {
      kind: 'error',
      message: normalizeRenderError(error),
    };
  }
}
