import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('collection loading state parity', () => {
  it('uses the legacy plain wrapper around the Ant Design spinner', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/client/modules/collection/collection.view.vue'), 'utf8');

    expect(source).toContain(
      '<div v-else-if="!collection" data-id="collection-loading" class="pt-16 text-center">',
    );
    expect(source).toContain('<a-spin />');
    expect(source).not.toContain('data-id="collection-loading">\n      Loading');
    expect(source).not.toContain('collection-state');
  });
});
