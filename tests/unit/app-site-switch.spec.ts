import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

function readAppSource() {
  return readFileSync(path.join(process.cwd(), 'src/client/App.vue'), 'utf8');
}

describe('app site-switch branch parity', () => {
  it('does not force the legacy China word-break style onto the cnn global branch', () => {
    const source = readAppSource();

    expect(source).not.toContain('style="word-break: keep-all;"');
    expect(source).toContain(':style="siteSwitchLinkStyle"');
    expect(source).toMatch(/siteSwitchLinkStyle\(\): \{ wordBreak: 'keep-all' \} \| undefined/);
    expect(source).toMatch(/return this\.siteAlias === 'cnn'\s*\?\s*undefined\s*:\s*\{ wordBreak: 'keep-all' \};/);
  });
});
