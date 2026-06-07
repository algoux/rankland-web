import { describe, expect, it } from 'vitest';
import { RanklandLogicException, RanklandLogicExceptionKind } from '@common/rankland-api';
import {
  classifyCollectionLoadError,
  classifySelectedRanklistLoadError,
} from '@client/modules/collection/collection-error';

describe('collection-error helpers', () => {
  it('classifies collection not found logic exceptions', () => {
    expect(classifyCollectionLoadError(new RanklandLogicException(RanklandLogicExceptionKind.NotFound))).toEqual({
      kind: 'not-found',
      message: 'Collection Not Found',
    });
  });

  it('classifies generic collection load errors', () => {
    expect(classifyCollectionLoadError(new Error('boom'))).toEqual({
      kind: 'generic',
      message: 'An error occurred while loading data',
    });
  });

  it('classifies selected ranklist load errors as content-level errors', () => {
    expect(classifySelectedRanklistLoadError(new Error('ranklist failed'))).toEqual({
      kind: 'ranklist-error',
      message: 'An error occurred while loading data',
    });
  });
});
