import { describe, expect, it } from 'vitest';
import type * as srk from '@algoux/standard-ranklist';
import {
  PLAYGROUND_AUTO_PREVIEW_MAX_LINES,
  createDefaultPlaygroundCode,
  getPlaygroundQueryValue,
  loadPlaygroundInitialCode,
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

  it('normalizes playground query values from router query data', () => {
    expect(getPlaygroundQueryValue(' rank-key ')).toBe('rank-key');
    expect(getPlaygroundQueryValue(['first-src', 'second-src'])).toBe('first-src');
    expect(getPlaygroundQueryValue(['', 'second-src'])).toBe('');
    expect(getPlaygroundQueryValue([])).toBe('');
    expect(getPlaygroundQueryValue(undefined)).toBe('');
    expect(getPlaygroundQueryValue(123)).toBe('');
  });

  it('loads initial playground code from a src URL when available', async () => {
    const sourceCode = '{"rows":[{"user":{"id":"u1","name":"User"}}]}';
    const formattedSourceCode = JSON.stringify(JSON.parse(sourceCode), null, 2);
    const fetchImpl = async (url: string) => {
      expect(url).toBe('https://example.test/rank.srk.json');
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => sourceCode,
      };
    };

    await expect(loadPlaygroundInitialCode({
      sourceUrl: 'https://example.test/rank.srk.json',
      fallbackCode: 'fallback-code',
      fetchImpl,
    })).resolves.toEqual({
      code: formattedSourceCode,
      error: null,
      sourceUrl: 'https://example.test/rank.srk.json',
    });
  });

  it('falls back to default playground code when src is missing', async () => {
    const fetchImpl = async () => {
      throw new Error('fetch should not run');
    };

    await expect(loadPlaygroundInitialCode({
      sourceUrl: '',
      fallbackCode: 'fallback-code',
      fetchImpl,
    })).resolves.toEqual({
      code: 'fallback-code',
      error: null,
      sourceUrl: '',
    });
  });

  it('falls back to default playground code when src download fails', async () => {
    const result = await loadPlaygroundInitialCode({
      sourceUrl: 'https://example.test/missing.srk.json',
      fallbackCode: 'fallback-code',
      fetchImpl: async () => ({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        text: async () => '',
      }),
    });

    expect(result.code).toBe('fallback-code');
    expect(result.sourceUrl).toBe('https://example.test/missing.srk.json');
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toContain('500 Server Error');
  });

  it('falls back to default playground code when src contains invalid JSON', async () => {
    const result = await loadPlaygroundInitialCode({
      sourceUrl: 'https://example.test/invalid.srk.json',
      fallbackCode: 'fallback-code',
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '{invalid',
      }),
    });

    expect(result.code).toBe('fallback-code');
    expect(result.sourceUrl).toBe('https://example.test/invalid.srk.json');
    expect(result.error).toBeInstanceOf(Error);
  });
});
