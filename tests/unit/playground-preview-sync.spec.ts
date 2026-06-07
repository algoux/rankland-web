import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { syncPlaygroundPreviewSource } from '@client/modules/playground/playground-preview-sync';

describe('syncPlaygroundPreviewSource', () => {
  it('updates draft source and valid preview parse state from the same Monaco change value', () => {
    const source = '{"type":"general","name":"Live Preview Fixture","rows":[]}';

    const result = syncPlaygroundPreviewSource(source);

    expect(result.draftSource).toBe(source);
    expect(result.parseState).toMatchObject({
      kind: 'valid',
      data: {
        name: 'Live Preview Fixture',
      },
    });
  });

  it('returns invalid preview state for malformed live-change source', () => {
    const result = syncPlaygroundPreviewSource('{');

    expect(result.draftSource).toBe('{');
    expect(result.parseState.kind).toBe('invalid');
  });
});

describe('playground live preview wiring', () => {
  it('uses the shared sync helper for Monaco changes and keyboard preview', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/client/modules/playground/playground.view.vue'),
      'utf8',
    );

    expect(source).toContain("import { syncPlaygroundPreviewSource } from './playground-preview-sync';");
    expect(source).toContain('const nextState = syncPlaygroundPreviewSource(value);');
    expect(source).toContain('const nextState = syncPlaygroundPreviewSource(this.draftSource);');
    expect(source).toContain('this.parseState = nextState.parseState;');
  });
});
