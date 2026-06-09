import { LogicException, LogicExceptionKind } from '@/services/ranklist-api';
import { SSR_SKIP_CACHE_HEADER } from '@common/ssr-cache';

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

export function writeRanklistPageSkipCacheResponse(options: {
  isClient?: boolean;
  writeResponse?: (params: { headers?: Record<string, string> }) => void;
}) {
  if (options.isClient) {
    return;
  }
  options.writeResponse?.({
    headers: {
      [SSR_SKIP_CACHE_HEADER]: '1',
    },
  });
}

export function writeRanklistPageErrorResponse(
  error: unknown,
  options: {
    isClient?: boolean;
    writeResponse?: (params: { status?: number; headers?: Record<string, string> }) => void;
  },
) {
  const errorKind = toRanklistPageErrorKind(error);
  if (errorKind === RanklistPageErrorKind.NotFound && !options.isClient) {
    options.writeResponse?.({ status: 404 });
  } else if (errorKind === RanklistPageErrorKind.LoadFailed && !options.isClient) {
    writeRanklistPageSkipCacheResponse(options);
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
