import { describe, expect, it } from 'vitest';
import { RanklandLogicException, RanklandLogicExceptionKind } from '@common/rankland-api';
import { classifyRanklistLoadError } from '@client/modules/ranklist/ranklist-error';

describe('classifyRanklistLoadError', () => {
  it('classifies not found logic exceptions', () => {
    expect(classifyRanklistLoadError(new RanklandLogicException(RanklandLogicExceptionKind.NotFound))).toEqual({
      kind: 'not-found',
      message: 'Ranklist Not Found',
    });
  });

  it('classifies generic errors', () => {
    expect(classifyRanklistLoadError(new Error('boom'))).toEqual({
      kind: 'generic',
      message: 'An error occurred while loading data',
    });
  });
});
