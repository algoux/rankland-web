const { defineConfig } = require('vite');
const path = require('path');
const viteSSR = require('vite-ssr/plugin');
const vue = require('@vitejs/plugin-vue');

const isProd = process.env.NODE_ENV === 'production';
const clientProcessEnv = {
  BWCX_RUNTIME_SCOPE: 'client',
  RANKLAND_API_BASE_SERVER: process.env.RANKLAND_API_BASE_SERVER,
  RANKLAND_CDN_API_BASE_SERVER: process.env.RANKLAND_CDN_API_BASE_SERVER,
  RANKLAND_API_BASE_CLIENT: process.env.RANKLAND_API_BASE_CLIENT,
  RANKLAND_CDN_API_BASE_CLIENT: process.env.RANKLAND_CDN_API_BASE_CLIENT,
  RANKLAND_SITE_ORIGIN: process.env.RANKLAND_SITE_ORIGIN,
  RANKLAND_SITE_ALIAS: process.env.RANKLAND_SITE_ALIAS,
  RANKLAND_HOST_CN: process.env.RANKLAND_HOST_CN,
  RANKLAND_HOST_GLOBAL: process.env.RANKLAND_HOST_GLOBAL,
  SITE_ALIAS: process.env.SITE_ALIAS,
  HOST_CN: process.env.HOST_CN,
  HOST_GLOBAL: process.env.HOST_GLOBAL,
  BEIAN: process.env.BEIAN,
  RANKLAND_LIVE_POLLING_INTERVAL: process.env.RANKLAND_LIVE_POLLING_INTERVAL,
  RANKLAND_WS_BASE: process.env.RANKLAND_WS_BASE,
  RANKLAND_SRK_STORAGE_BASE: process.env.RANKLAND_SRK_STORAGE_BASE,
  SRK_STORAGE_BASE: process.env.SRK_STORAGE_BASE,
};

if (process.env.RANKLAND_E2E_PROBE === '1') {
  clientProcessEnv.RANKLAND_E2E_PROBE = process.env.RANKLAND_E2E_PROBE;
}

module.exports = defineConfig({
  server: {
    fs: {
      // The API logic is in outside of the project
      strict: false,
    },
  },
  // If using CDN, you can set base like 'https://yourcdn.com/dist/'
  base: isProd ? '/dist/' : undefined,
  define: {
    'process.env.RANKLAND_E2E_PROBE': JSON.stringify(process.env.RANKLAND_E2E_PROBE),
    'process.env': clientProcessEnv,
  },
  resolve: {
    alias: {
      '@public': path.resolve(__dirname, './public'),
      '@client': path.resolve(__dirname, './src/client'),
      '@common': path.resolve(__dirname, './src/common'),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        sourcemapExcludeSources: true,
      },
    },
  },
  optimizeDeps: {
    include: ['monaco-editor'],
  },
  plugins: [
    vue(),
    viteSSR({
      build: {
        keepIndexHtml: true,
      },
    }),
  ],
});
