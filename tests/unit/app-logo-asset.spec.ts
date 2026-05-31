import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

function readPngSize(buffer: Buffer) {
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

describe('app logo asset parity', () => {
  it('uses the legacy RankLand RL logo asset', () => {
    const logo = readFileSync(resolve(__dirname, '../../src/client/assets/logo.png'));
    const hash = createHash('sha256').update(logo).digest('hex');

    expect(hash).toBe('8e9c8237ad0b34e1277a444738fcf7c8bc30510c47559e16bd45eec9f36f9edb');
    expect(readPngSize(logo)).toEqual({ width: 128, height: 128 });
  });
});
