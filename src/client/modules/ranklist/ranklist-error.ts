import { RanklandLogicException, RanklandLogicExceptionKind } from '@common/rankland-api';

export type RanklistLoadErrorKind = 'not-found' | 'generic';

export interface RanklistLoadErrorState {
  kind: RanklistLoadErrorKind;
  message: string;
}

export function classifyRanklistLoadError(error: unknown): RanklistLoadErrorState {
  if (error instanceof RanklandLogicException && error.kind === RanklandLogicExceptionKind.NotFound) {
    return {
      kind: 'not-found',
      message: 'Ranklist Not Found',
    };
  }

  return {
    kind: 'generic',
    message: 'An error occurred while loading data',
  };
}
