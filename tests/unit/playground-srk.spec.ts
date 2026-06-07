import { describe, expect, it } from 'vitest';
import { parsePlaygroundSrkSource } from '@client/modules/playground/playground-srk';

describe('parsePlaygroundSrkSource', () => {
  it('accepts JSON objects', () => {
    const result = parsePlaygroundSrkSource('{"type":"general","rows":[]}');

    expect(result).toMatchObject({
      kind: 'valid',
      data: {
        type: 'general',
        rows: [],
      },
    });
  });

  it('rejects malformed JSON with a parser message', () => {
    const result = parsePlaygroundSrkSource('{');

    expect(result.kind).toBe('invalid');
    if (result.kind === 'invalid') {
      expect(result.message.length).toBeGreaterThan(0);
    }
  });

  it('rejects arrays', () => {
    expect(parsePlaygroundSrkSource('[]')).toEqual({
      kind: 'invalid',
      message: 'SRK JSON must be an object.',
    });
  });

  it('rejects null', () => {
    expect(parsePlaygroundSrkSource('null')).toEqual({
      kind: 'invalid',
      message: 'SRK JSON must be an object.',
    });
  });

  it('rejects primitive values', () => {
    expect(parsePlaygroundSrkSource('"srk"')).toEqual({
      kind: 'invalid',
      message: 'SRK JSON must be an object.',
    });
  });
});
