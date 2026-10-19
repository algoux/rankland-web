import { describe, expect, it, vi } from 'vitest';
import { ApiRequestException } from '@/api';
import { LogicException, LogicExceptionKind } from '@/services/ranklist-api';
import { ErrCode } from '@common/enums/err-code.enum';
import { LiveContestTransportError } from '@/services/ranklist-api/live-contest-transport';
import { SSR_SKIP_CACHE_HEADER } from '@common/ssr-cache';
import {
  RanklistPageErrorKind,
  shouldLogRanklistPageError,
  toRanklistPageErrorKind,
  writeRanklistPageErrorResponse,
  writeRanklistPageSkipCacheResponse,
} from './page-error';

describe('ranklist page error normalization', () => {
  it('keeps LogicException not-found errors serializable for SSR props', () => {
    expect(toRanklistPageErrorKind(new LogicException(LogicExceptionKind.NotFound))).toBe(RanklistPageErrorKind.NotFound);
  });

  it('recognizes not-found errors after SSR serialization strips the prototype', () => {
    expect(toRanklistPageErrorKind({ kind: LogicExceptionKind.NotFound })).toBe(RanklistPageErrorKind.NotFound);
  });

  it('recognizes API v2 contest-not-found errors and HTTP 404 responses', () => {
    expect(toRanklistPageErrorKind(
      new ApiRequestException(ErrCode.ContestNotFound, 'contest not found'),
    )).toBe(RanklistPageErrorKind.NotFound);
    expect(toRanklistPageErrorKind({ status: 404 })).toBe(RanklistPageErrorKind.NotFound);
    expect(toRanklistPageErrorKind({ response: { status: 404 } })).toBe(RanklistPageErrorKind.NotFound);
    expect(toRanklistPageErrorKind(
      new LiveContestTransportError('missing', { status: 404 }),
    )).toBe(RanklistPageErrorKind.NotFound);
    expect(toRanklistPageErrorKind(
      new LiveContestTransportError('invalid', { status: 422 }),
    )).toBe(RanklistPageErrorKind.LoadFailed);
  });

  it('falls back to a generic load error for unknown failures', () => {
    expect(toRanklistPageErrorKind(new Error('boom'))).toBe(RanklistPageErrorKind.LoadFailed);
  });

  it('does not log expected not-found errors', () => {
    expect(shouldLogRanklistPageError(new LogicException(LogicExceptionKind.NotFound))).toBe(false);
    expect(shouldLogRanklistPageError({ kind: LogicExceptionKind.NotFound })).toBe(false);
    expect(shouldLogRanklistPageError(new Error('boom'))).toBe(true);
  });

  it('marks missing ranklists as 404 during SSR only', () => {
    const ssrWriteResponse = vi.fn();
    const clientWriteResponse = vi.fn();

    expect(writeRanklistPageErrorResponse(new LogicException(LogicExceptionKind.NotFound), {
      isClient: false,
      writeResponse: ssrWriteResponse,
    })).toBe(RanklistPageErrorKind.NotFound);
    expect(ssrWriteResponse).toHaveBeenCalledWith({ status: 404 });

    writeRanklistPageErrorResponse(new LogicException(LogicExceptionKind.NotFound), {
      isClient: true,
      writeResponse: clientWriteResponse,
    });
    expect(clientWriteResponse).not.toHaveBeenCalled();
  });

  it('marks server-side transient load failures as not cacheable', () => {
    const writeResponse = vi.fn();

    expect(writeRanklistPageErrorResponse(new Error('upstream down'), {
      isClient: false,
      writeResponse,
    })).toBe(RanklistPageErrorKind.LoadFailed);
    expect(writeResponse).toHaveBeenCalledWith({
      headers: {
        [SSR_SKIP_CACHE_HEADER]: '1',
      },
    });
  });

  it('can mark server-side partial page failures as not cacheable without changing status', () => {
    const writeResponse = vi.fn();

    writeRanklistPageSkipCacheResponse({ isClient: false, writeResponse });

    expect(writeResponse).toHaveBeenCalledWith({
      headers: {
        [SSR_SKIP_CACHE_HEADER]: '1',
      },
    });
  });
});
