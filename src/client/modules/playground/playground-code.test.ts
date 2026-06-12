import { describe, expect, it } from 'vitest';
import type * as srk from '@algoux/standard-ranklist';
import {
  PLAYGROUND_AUTO_PREVIEW_MAX_LINES,
  createDefaultPlaygroundCode,
  parsePlaygroundCode,
  shouldUseFastFullDocumentPaste,
} from './playground-code';

function createLargePlaygroundCode() {
  return new Array(PLAYGROUND_AUTO_PREVIEW_MAX_LINES + 2).fill('{"row":true}').join('\n');
}

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

  it('uses the fast paste path for full-document or already-large document pastes', () => {
    const largeCode = createLargePlaygroundCode();

    expect(shouldUseFastFullDocumentPaste({
      isCurrentDocumentLarge: false,
      isFullDocumentSelection: true,
      pastedText: largeCode,
    })).toBe(true);

    expect(shouldUseFastFullDocumentPaste({
      isCurrentDocumentLarge: false,
      isFullDocumentSelection: false,
      pastedText: largeCode,
    })).toBe(false);

    expect(shouldUseFastFullDocumentPaste({
      isCurrentDocumentLarge: true,
      isFullDocumentSelection: false,
      pastedText: largeCode,
    })).toBe(true);

    expect(shouldUseFastFullDocumentPaste({
      isCurrentDocumentLarge: true,
      isFullDocumentSelection: true,
      pastedText: '{"rows":[]}',
    })).toBe(false);
  });
});
