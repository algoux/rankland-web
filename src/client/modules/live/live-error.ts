import {
  RanklandLogicException,
  RanklandLogicExceptionKind,
} from '@common/rankland-api';

export type LiveLoadErrorState =
  | {
      kind: 'not-found';
    }
  | {
      kind: 'generic';
      message: string;
    };

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error || 'Unknown live ranklist load error.');
}

export function classifyLiveLoadError(error: unknown): LiveLoadErrorState {
  if (error instanceof RanklandLogicException && error.kind === RanklandLogicExceptionKind.NotFound) {
    return { kind: 'not-found' };
  }

  return {
    kind: 'generic',
    message: normalizeErrorMessage(error),
  };
}
