import { describe, expect, it } from 'vitest';
import {
  RanklandLogicException,
  RanklandLogicExceptionKind,
} from '@common/rankland-api';
import { classifyLiveLoadError } from '@client/modules/live/live-error';

describe('classifyLiveLoadError', () => {
  it('maps Rankland NotFound logic errors to not-found', () => {
    const state = classifyLiveLoadError(new RanklandLogicException(RanklandLogicExceptionKind.NotFound));

    expect(state).toEqual({ kind: 'not-found' });
  });

  it('maps other errors to generic with a message', () => {
    const state = classifyLiveLoadError(new Error('network failed'));

    expect(state).toEqual({ kind: 'generic', message: 'network failed' });
  });
});
