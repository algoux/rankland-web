import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('collection loading state parity', () => {
  it('uses the legacy Ant Design spinner with pt-16 text-center state styling', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/client/modules/collection/collection.view.vue'), 'utf8');

    expect(source).toContain(
      '<a-spin v-else-if="!collection" data-id="collection-loading" class="collection-state pt-16 text-center" />',
    );
    expect(source).not.toContain('data-id="collection-loading" class="collection-state pt-16 text-center">\n      Loading');
    expect(source).toContain('.collection-state {\n  padding: 64px 16px;\n  text-align: center;');
  });
});
