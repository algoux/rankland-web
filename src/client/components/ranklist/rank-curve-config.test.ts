import { describe, expect, test } from 'vitest';
import g2Package from '@antv/g2/package.json';

describe('RankCurve visual parity config', () => {
  test('pins G2 to the source version used by rankland-fe', () => {
    expect(g2Package.version).toBe('5.0.13');
  });
});
