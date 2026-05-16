import { defineConfig, devices } from '@playwright/test';

const externalBaseURL = process.env.E2E_BASE_URL;
const appPort = process.env.FULL_CHAIN_APP_PORT || '3100';
const baseURL = externalBaseURL || `http://127.0.0.1:${appPort}`;

export default defineConfig({
  testDir: './tests/e2e/full-chain',
  timeout: 45_000,
  fullyParallel: false,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: externalBaseURL
    ? undefined
    : {
        command: 'node tests/e2e/support/start-full-chain-e2e.js',
        url: `${baseURL}/__e2e/health`,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
