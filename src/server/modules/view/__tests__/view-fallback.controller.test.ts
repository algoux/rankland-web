import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('ViewFallbackController', () => {
  it('renders the Vue 404 fallback with SSR in production', () => {
    const source = readFileSync(path.join(__dirname, '../view-fallback.controller.ts'), 'utf-8');

    expect(source).toContain('this.service.render(RenderMethodKind.SSR, { defaultStatus: 404 })');
    expect(source).not.toContain("when: 'production'");
  });
});
