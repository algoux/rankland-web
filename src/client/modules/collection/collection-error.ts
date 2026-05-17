import { RanklandLogicException, RanklandLogicExceptionKind } from '@common/rankland-api';

export type CollectionLoadErrorKind = 'not-found' | 'generic';

export interface CollectionLoadErrorState {
  kind: CollectionLoadErrorKind;
  message: string;
}

export interface SelectedRanklistLoadErrorState {
  kind: 'ranklist-error';
  message: string;
}

export function classifyCollectionLoadError(error: unknown): CollectionLoadErrorState {
  if (error instanceof RanklandLogicException && error.kind === RanklandLogicExceptionKind.NotFound) {
    return {
      kind: 'not-found',
      message: 'Collection Not Found',
    };
  }

  return {
    kind: 'generic',
    message: 'An error occurred while loading data',
  };
}

export function classifySelectedRanklistLoadError(error: unknown): SelectedRanklistLoadErrorState {
  return {
    kind: 'ranklist-error',
    message: 'An error occurred while loading data',
  };
}
