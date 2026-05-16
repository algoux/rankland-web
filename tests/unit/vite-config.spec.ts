import { describe, expect, it } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const viteConfig = require('../../vite.config.js');

describe('vite config', () => {
  it('injects RankLand API env keys into bundled process.env', () => {
    expect(viteConfig.define['process.env']).toHaveProperty('RANKLAND_API_BASE_SERVER');
    expect(viteConfig.define['process.env']).toHaveProperty('RANKLAND_CDN_API_BASE_SERVER');
    expect(viteConfig.define['process.env']).toHaveProperty('RANKLAND_API_BASE_CLIENT');
    expect(viteConfig.define['process.env']).toHaveProperty('RANKLAND_CDN_API_BASE_CLIENT');
  });
});
