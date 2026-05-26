import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('collection selected ranklist loading parity', () => {
  it('uses the legacy Ant Design spinner while selected ranklist data is switching', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/client/modules/collection/collection.view.vue'), 'utf8');

    expect(source).toContain(
      '<a-spin v-else-if="isRanklistSwitching" data-id="collection-ranklist-loading" class="collection-state" />',
    );
    expect(source).toContain('isRanklistSwitching(): boolean');
    expect(source).toContain('return Boolean(this.renderSwitchLock || (loadedRankId && this.rankId && loadedRankId !== this.rankId));');
    expect(source).toContain('.collection-state {\n  padding: 64px 16px;\n  text-align: center;');
  });
});
