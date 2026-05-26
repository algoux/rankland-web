import { afterEach, describe, expect, it } from 'vitest';

const VITE_CONFIG_PATH = '../../vite.config.js';
const ranklandEnv = {
  RANKLAND_API_BASE_SERVER: 'http://server.example/api',
  RANKLAND_CDN_API_BASE_SERVER: 'http://cdn-server.example/api',
  RANKLAND_API_BASE_CLIENT: 'https://client.example/api',
  RANKLAND_CDN_API_BASE_CLIENT: 'https://cdn-client.example/api',
};
const e2eProbeEnv = { RANKLAND_E2E_PROBE: '1' };
const ranklandSiteEnv = {
  RANKLAND_SITE_ORIGIN: 'https://rankland.example',
  RANKLAND_SITE_ALIAS: 'cnn',
  RANKLAND_HOST_CN: 'rankland.cn.example',
  RANKLAND_HOST_GLOBAL: 'rankland.global.example',
  SITE_ALIAS: 'legacy-cnn',
  HOST_CN: 'legacy.cn.example',
  HOST_GLOBAL: 'legacy.global.example',
  BEIAN: '鲁ICP备00000000号',
};
const ranklandLiveEnv = {
  RANKLAND_LIVE_POLLING_INTERVAL: '250',
  RANKLAND_WS_BASE: 'ws://127.0.0.1:3101',
};
const ranklandAssetEnv = {
  RANKLAND_SRK_STORAGE_BASE: 'https://assets.example/srk',
  SRK_STORAGE_BASE: 'https://legacy-assets.example/srk',
};
const ranklandAnalyticsEnv = {
  RANKLAND_GTAG: 'G-RANKLAND',
  GTAG: 'G-LEGACY',
};

const originalEnv = Object.fromEntries(
  Object.keys({
    ...ranklandEnv,
    ...e2eProbeEnv,
    ...ranklandSiteEnv,
    ...ranklandLiveEnv,
    ...ranklandAssetEnv,
    ...ranklandAnalyticsEnv,
  }).map((key) => [key, process.env[key]]),
) as Record<
  | keyof typeof ranklandEnv
  | keyof typeof e2eProbeEnv
  | keyof typeof ranklandSiteEnv
  | keyof typeof ranklandLiveEnv
  | keyof typeof ranklandAssetEnv
  | keyof typeof ranklandAnalyticsEnv,
  string | undefined
>;

function restoreEnv() {
  for (const key of Object.keys(originalEnv) as Array<keyof typeof originalEnv>) {
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

  it('injects RankLand API and site env values into bundled process.env', () => {
    Object.assign(
      process.env,
      ranklandEnv,
      e2eProbeEnv,
      ranklandSiteEnv,
      ranklandLiveEnv,
      ranklandAssetEnv,
      ranklandAnalyticsEnv,
    );
    delete require.cache[require.resolve(VITE_CONFIG_PATH)];

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const viteConfig = require(VITE_CONFIG_PATH);

    expect(viteConfig.define['process.env']).toMatchObject(ranklandEnv);
    expect(viteConfig.define['process.env']).toMatchObject(ranklandSiteEnv);
    expect(viteConfig.define['process.env']).toMatchObject(ranklandLiveEnv);
    expect(viteConfig.define['process.env']).toMatchObject(ranklandAssetEnv);
    expect(viteConfig.define['process.env']).toMatchObject(ranklandAnalyticsEnv);
    expect(viteConfig.define['process.env']).toHaveProperty('RANKLAND_E2E_PROBE', '1');
    expect(viteConfig.define['process.env.RANKLAND_E2E_PROBE']).toBe('"1"');
  });

  it('keeps the probe flag out of bundled process.env when disabled', () => {
    Object.assign(process.env, ranklandEnv);
    delete process.env.RANKLAND_E2E_PROBE;
    delete require.cache[require.resolve(VITE_CONFIG_PATH)];

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const viteConfig = require(VITE_CONFIG_PATH);

    expect(viteConfig.define['process.env']).not.toHaveProperty('RANKLAND_E2E_PROBE');
    expect(viteConfig.define['process.env.RANKLAND_E2E_PROBE']).toBeUndefined();
  });

  it('excludes original sources from generated source maps', () => {
    delete require.cache[require.resolve(VITE_CONFIG_PATH)];

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const viteConfig = require(VITE_CONFIG_PATH);

    expect(viteConfig.build.rollupOptions.output.sourcemapExcludeSources).toBe(true);
  });

  it('pre-bundles Monaco editor for the playground editor route', () => {
    delete require.cache[require.resolve(VITE_CONFIG_PATH)];

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const viteConfig = require(VITE_CONFIG_PATH);

    expect(viteConfig.optimizeDeps.include).toContain('monaco-editor');
  });
});
