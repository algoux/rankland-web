import { describe, expect, it } from 'vitest';
import type * as srk from '@algoux/standard-ranklist';
import fixture from '../fixtures/ranklist.srk.json';
import { createRanklandRanklistState } from '@client/components/rankland-ranklist-state';

describe('createRanklandRanklistState', () => {
  it('returns static ranklist data for valid SRK input', () => {
    const result = createRanklandRanklistState(fixture as srk.Ranklist);

    expect(result.kind).toBe('ready');
    if (result.kind === 'ready') {
      expect(result.staticRanklist.rows).toHaveLength(2);
      expect(result.staticRanklist.rows[0].user.name).toBe('Team Alpha');
    }
  });

  it('returns a render error for SRK input that cannot be converted', () => {
    const result = createRanklandRanklistState({ type: 'general' } as srk.Ranklist);

    expect(result.kind).toBe('error');
    if (result.kind === 'error') {
      expect(result.message).toContain('Cannot read');
    }
  });
});
