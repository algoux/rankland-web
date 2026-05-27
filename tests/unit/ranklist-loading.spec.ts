import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('ranklist loading state parity', () => {
  it('uses the legacy Ant Design spinner with mt-16 text-center state styling', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/client/modules/ranklist/ranklist.view.vue'), 'utf8');

    expect(source).toContain(
      '<a-spin v-else-if="!ranklist" data-id="ranklist-loading" class="ranklist-state mt-16 text-center" />',
    );
    expect(source).not.toContain('data-id="ranklist-loading">\n      Loading');
    expect(source).toContain('.ranklist-state {\n  margin-top: 64px;\n  text-align: center;');
  });
});
