import { describe, expect, it } from 'vitest';
import {
  getPlaygroundJsonDiagnosticsOptions,
  getPlaygroundMonacoTheme,
} from '../../src/client/modules/playground/playground-monaco';
import srkPkg from '@algoux/standard-ranklist/package.json';

describe('playground Monaco helpers', () => {
  it('builds SRK JSON diagnostics options for Monaco', () => {
    const options = getPlaygroundJsonDiagnosticsOptions();

    expect(options.validate).toBe(true);
    expect(options.allowComments).toBe(false);
    expect(options.schemas).toHaveLength(1);
    expect(options.schemas?.[0]).toMatchObject({
      uri: `https://unpkg.com/@algoux/standard-ranklist@${srkPkg.version}/schema.json`,
      fileMatch: ['*'],
    });
    expect(options.schemas?.[0].schema).toEqual(expect.objectContaining({ $schema: expect.any(String) }));
  });

  it('maps RankLand theme state to Monaco themes', () => {
    expect(getPlaygroundMonacoTheme(true)).toBe('vs-dark');
    expect(getPlaygroundMonacoTheme(false)).toBe('vs-light');
  });
});
