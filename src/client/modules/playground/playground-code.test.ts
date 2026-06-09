import { describe, expect, it } from 'vitest';
import type * as srk from '@algoux/standard-ranklist';
import { createDefaultPlaygroundCode, parsePlaygroundCode } from './playground-code';

describe('playground code helpers', () => {
  it('creates valid default srk JSON for the live preview', () => {
    const result = parsePlaygroundCode(createDefaultPlaygroundCode());

    expect(result.valid).toBe(true);
    expect((result.data as srk.Ranklist).contest.title).toBe('ACM-ICPC World Finals 2018 (Excerpt Demo)');
  });

  it('rejects invalid JSON without throwing', () => {
    const result = parsePlaygroundCode('{ bad json');

    expect(result).toMatchObject({
      valid: false,
      data: null,
    });
  });

  it('rejects JSON that is not shaped like an srk ranklist', () => {
    expect(parsePlaygroundCode('{}')).toMatchObject({
      valid: false,
      data: null,
    });
    expect(parsePlaygroundCode('[]')).toMatchObject({
      valid: false,
      data: null,
    });
  });
});
