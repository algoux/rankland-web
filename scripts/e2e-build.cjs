/* eslint-disable @typescript-eslint/no-require-imports */
const { spawnSync } = require('child_process');

const mockApiPort = process.env.E2E_MOCK_API_PORT || '4322';
const mockApiBase = `http://127.0.0.1:${mockApiPort}`;
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const result = spawnSync(npmBin, ['run', 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    LEGACY_API_BASE_CLIENT: mockApiBase,
    VIN_URL: `${mockApiBase}/vin.txt`,
    WS_BASE: `ws://127.0.0.1:${mockApiPort}`,
  },
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
