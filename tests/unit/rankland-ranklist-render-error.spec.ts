import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('rankland ranklist render-error wrapper parity', () => {
  it('uses the legacy plain alert wrapper style without a Vue-only product class', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/client/components/rankland-ranklist.vue'),
      'utf8',
    );

    expect(source).toContain('data-id="rankland-ranklist-render-error"');
    expect(source).toContain('role="alert"');
    expect(source).toContain('style="max-width: 400px; margin: 100px auto"');
    expect(source).not.toContain('class="rankland-ranklist-error"');
    expect(source).not.toContain('.rankland-ranklist-error {');
  });
});
