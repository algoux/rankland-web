import { afterEach, describe, expect, it } from 'vitest';

const VITE_CONFIG_PATH = '../../vite.config.js';
const ranklandEnv = {
  RANKLAND_API_BASE_SERVER: 'http://server.example/api',
  RANKLAND_CDN_API_BASE_SERVER: 'http://cdn-server.example/api',
  RANKLAND_API_BASE_CLIENT: 'https://client.example/api',
  RANKLAND_CDN_API_BASE_CLIENT: 'https://cdn-client.example/api',
  RANKLAND_E2E_PROBE: '1',
};

const originalEnv = Object.fromEntries(
  Object.keys(ranklandEnv).map((key) => [key, process.env[key]]),
) as Record<keyof typeof ranklandEnv, string | undefined>;

function restoreEnv() {
  for (const key of Object.keys(ranklandEnv) as Array<keyof typeof ranklandEnv>) {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  }
}

describe('vite config', () => {
  afterEach(() => {
    restoreEnv();
    delete require.cache[require.resolve(VITE_CONFIG_PATH)];
  });

  it('injects RankLand API env values into bundled process.env', () => {
    Object.assign(process.env, ranklandEnv);
    delete require.cache[require.resolve(VITE_CONFIG_PATH)];

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const viteConfig = require(VITE_CONFIG_PATH);

    expect(viteConfig.define['process.env']).toMatchObject(ranklandEnv);
    expect(viteConfig.define['process.env.RANKLAND_E2E_PROBE']).toBe('"1"');
  });
});
