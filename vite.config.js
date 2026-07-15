const { defineConfig } = require('vite');
const path = require('path');
const viteSSR = require('vite-ssr/plugin');
const vue = require('@vitejs/plugin-vue');
const { isSameOriginWorkerAsset, toSameOriginWorkerAssetUrl } = require('./scripts/worker-assets.cjs');

function buildClientEnv() {
  return {
    LEGACY_API_BASE_CLIENT: process.env.LEGACY_API_BASE_CLIENT || 'https://rl-api.algoux.cn',
    SRK_STORAGE_BASE: process.env.SRK_STORAGE_BASE || 'https://cdn.algoux.cn/srk-storage',
    VIN_URL: process.env.VIN_URL || 'https://cdn.algoux.cn/rankland/vin.txt',
    HOST_GLOBAL: process.env.HOST_GLOBAL || 'rl.algoux.org',
    HOST_CN: process.env.HOST_CN || 'rl.algoux.cn',
    SITE_ALIAS: process.env.SITE_ALIAS || 'global',
    BEIAN: process.env.BEIAN || '',
    LIVE_POLLING_INTERVAL: process.env.LIVE_POLLING_INTERVAL || '10000',
    WS_BASE: process.env.WS_BASE || '',
    GTAG: process.env.GTAG || '',
    BUILD_COMMIT: process.env.BUILD_COMMIT || '',
  };
}

module.exports = defineConfig(({ command }) => {
  const isBuild = command === 'build';

  return {
    server: {
      fs: {
        // The API logic is in outside of the project
        strict: false,
      },
    },
    // If using CDN, you can set base like 'https://yourcdn.com/dist/'
    base: isBuild ? process.env.CDN_BASE || '/dist/' : undefined,
    experimental: {
      renderBuiltUrl(filename) {
        if (isSameOriginWorkerAsset(filename)) {
          return toSameOriginWorkerAssetUrl(filename);
        }
      },
    },
    define: {
      'process.env.BWCX_RUNTIME_SCOPE': JSON.stringify('client'),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || (isBuild ? 'production' : 'development')),
      __RANKLAND_CLIENT_ENV__: JSON.stringify(buildClientEnv()),
    },
    resolve: {
      alias: {
        '@public': path.resolve(__dirname, './public'),
        '@client': path.resolve(__dirname, './src/client'),
        '@common': path.resolve(__dirname, './src/common'),
        '@': path.resolve(__dirname, './src/client'),
      },
    },
    build: {
      sourcemap: true,
    },
    plugins: [
      viteSSR({
        build: {
          keepIndexHtml: true,
        },
      }),
      vue(),
    ],
  };
});
