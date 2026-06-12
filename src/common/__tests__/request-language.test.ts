import { describe, expect, it } from 'vitest';
import { parseAcceptLanguageHeader } from '../request-language';

describe('request language helpers', () => {
  it('parses Accept-Language by q value and original priority', () => {
    expect(parseAcceptLanguageHeader('en-US,en;q=0.8,zh-CN;q=0.9')).toEqual(['en-US', 'zh-CN', 'en']);
  });

  it('deduplicates languages case-insensitively after canonicalization', () => {
    expect(parseAcceptLanguageHeader('zh-cn;q=0.8, zh-CN;q=0.7, en_us;q=0.6')).toEqual(['zh-CN', 'en-US']);
  });

  it('ignores wildcards, empty values, and q=0 entries', () => {
    expect(parseAcceptLanguageHeader('*, fr;q=0, ;q=0.9, zh;q=0.5')).toEqual(['zh']);
  });

  it('returns undefined when the request has no effective language', () => {
    expect(parseAcceptLanguageHeader(undefined)).toBeUndefined();
    expect(parseAcceptLanguageHeader('')).toBeUndefined();
    expect(parseAcceptLanguageHeader('*;q=0.5, en;q=0')).toBeUndefined();
  });
});
