import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('client route generator config', () => {
  it('excludes e2e probe views from generated public route files', () => {
    const script = readFileSync(path.join(process.cwd(), 'scripts/client-routes.gen.js'), 'utf8');

    expect(script).toContain("'!modules/e2e/**/*.view.vue'");
    expect(script).toContain("'!modules/e2e/**/*.view.tsx'");
  });

  it('excludes scaffold demo/about views from generated RankLand public routes', () => {
    const script = readFileSync(path.join(process.cwd(), 'scripts/client-routes.gen.js'), 'utf8');

    expect(script).toContain("'!modules/about/**/*.view.vue'");
    expect(script).toContain("'!modules/demo/**/*.view.vue'");
  });
});
