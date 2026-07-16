import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT || 4321);
const MOCK_API_PORT = Number(process.env.E2E_MOCK_API_PORT || 4322);
const BASE_URL = process.env.E2E_BASE_URL || `http://127.0.0.1:${PORT}`;
const MOCK_API_BASE = `http://127.0.0.1:${MOCK_API_PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]] : 'list',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: `node scripts/e2e-mock-rankland-api.cjs`,
      url: `${MOCK_API_BASE}/__health`,
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        PORT: String(MOCK_API_PORT),
      },
    },
    {
      command: 'node scripts/e2e-server.cjs',
      url: BASE_URL,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        NODE_ENV: 'production',
        SERVER_PORT: String(PORT),
        MYSQL_HOST: process.env.MYSQL_HOST || '127.0.0.1',
        MYSQL_PORT: process.env.MYSQL_PORT || '3306',
        MYSQL_USER: process.env.MYSQL_USER || 'blue',
        MYSQL_PASS: process.env.MYSQL_PASS || 'test',
        MYSQL_DB: 'rankland_e2e',
        REDIS_NAMESPACE: `rankland-e2e-${PORT}`,
        LEGACY_API_BASE_SERVER: MOCK_API_BASE,
        LEGACY_API_BASE_CLIENT: MOCK_API_BASE,
        WS_BASE: `ws://127.0.0.1:${MOCK_API_PORT}`,
      },
    },
  ],
});
