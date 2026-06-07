import { describe, expect, it } from 'vitest';
import appPkg from '../../package.json';
import srkPkg from '@algoux/standard-ranklist/package.json';
import ranklistFixture from '../fixtures/ranklist.srk.json';

describe('SRK dependency baseline', () => {
  it('uses the old RankLand SRK schema/runtime version accepted by migrated fixtures', () => {
    expect(srkPkg.version).toBe(ranklistFixture.version);
    expect(appPkg.dependencies['@algoux/standard-ranklist']).toBe('^0.3.12');
  });

  it('declares the old RankLand SRK utility baseline used by the renderer stack', () => {
    expect(appPkg.dependencies['@algoux/standard-ranklist-utils']).toBe('^0.2.13');
  });
});
