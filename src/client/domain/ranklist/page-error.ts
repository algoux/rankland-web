import { LogicException, LogicExceptionKind } from '@/services/ranklist-api';

export enum RanklistPageErrorKind {
  NotFound = 'not-found',
  LoadFailed = 'load-failed',
}

export function toRanklistPageErrorKind(error: unknown) {
  if (error instanceof LogicException && error.kind === LogicExceptionKind.NotFound) {
    return RanklistPageErrorKind.NotFound;
  }
  if (isSerializedNotFound(error)) {
    return RanklistPageErrorKind.NotFound;
  }
  return RanklistPageErrorKind.LoadFailed;
}

export function shouldLogRanklistPageError(error: unknown) {
  return toRanklistPageErrorKind(error) !== RanklistPageErrorKind.NotFound;
}

export function writeRanklistPageErrorResponse(
  error: unknown,
  options: {
    isClient?: boolean;
    writeResponse?: (params: { status?: number }) => void;
  },
) {
  const errorKind = toRanklistPageErrorKind(error);
  if (errorKind === RanklistPageErrorKind.NotFound && !options.isClient) {
    options.writeResponse?.({ status: 404 });
  }
  return errorKind;
}

function isSerializedNotFound(error: unknown) {
  return Boolean(
    error
    && typeof error === 'object'
    && 'kind' in error
    && (error as { kind?: unknown }).kind === LogicExceptionKind.NotFound,
  );
}
