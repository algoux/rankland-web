import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('app shell SRK style parity', () => {
  it('restores the legacy macOS Blink table header box model override', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/client/index.less'), 'utf8');

    expect(source).toContain('body.optimize-decrease-effects .srk-main');
    expect(source).toMatch(
      /body\.optimize-decrease-effects \.srk-main table\s+thead > tr > th\s*{\s*box-sizing: content-box;\s*}/,
    );
  });
});
