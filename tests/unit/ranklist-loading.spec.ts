import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('ranklist loading state parity', () => {
  it('uses the legacy plain wrapper around the Ant Design spinner', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/client/modules/ranklist/ranklist.view.vue'), 'utf8');

    expect(source).toContain(
      '<div v-else-if="!ranklist" data-id="ranklist-loading" class="mt-16 text-center">',
    );
    expect(source).toContain('<a-spin />');
    expect(source).not.toContain('data-id="ranklist-loading">\n      Loading');
    expect(source).not.toContain('ranklist-state');
  });
});
