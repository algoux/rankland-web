import { spawnSync } from 'child_process';
import path from 'path';
import { build } from 'vite';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { productionClientGuard } from '../../../scripts/production-client-guard.cjs';
import packageJson from '../../../package.json';
const projectRoot = path.resolve(__dirname, '../../..');

function resolveBuildConfig(environment?: string, useBuildEntry = false) {
  const env = { ...process.env };
  delete env.NODE_ENV;
  delete env.MODE;
  if (environment) env.NODE_ENV = environment;
  const probe = `
    require('vite-ssr/config').resolveViteConfig('production')
      .then(config => console.log(JSON.stringify({
        isProduction: config.isProduction,
        nodeEnv: process.env.NODE_ENV,
        definedNodeEnv: config.define['process.env.NODE_ENV']
      })))
      .catch(error => { console.error(error.message); process.exitCode = 1; });
  `;
  const command = [process.execPath, '-'];
  if (useBuildEntry) {
    // Exercise the environment prefix of the real build command, before
    // vite-ssr's preliminary config resolution can populate NODE_ENV.
    const prefix = packageJson.scripts['build:client'].match(/\bcross-env (.*?) vite-ssr build\b/);
    expect(prefix).not.toBeNull();
    command.unshift(require.resolve('cross-env/src/bin/cross-env.js'), ...prefix[1].split(' '));
  }
  return spawnSync(process.execPath, useBuildEntry ? command : command.slice(1), {
    cwd: projectRoot,
    env,
    encoding: 'utf8',
    input: probe,
  });
}

async function buildFixture(code: string) {
  return build({
    configFile: false,
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    plugins: [
      {
        name: 'production-guard-fixture',
        resolveId: (id) => id === 'fixture' ? '/rankland-production-guard-fixture.js' : null,
        load: (id) => id === '/rankland-production-guard-fixture.js' ? code : null,
      },
      productionClientGuard(),
    ],
    build: {
      write: false,
      sourcemap: true,
      rollupOptions: { input: 'fixture' },
    },
  });
}

describe('production client build', () => {
  beforeAll(() => vi.stubEnv('NODE_ENV', 'production'));
  afterAll(() => vi.unstubAllEnvs());

  it.each([undefined, 'development'])('sets production at the build entry for inherited NODE_ENV=%s', (environment) => {
    const result = resolveBuildConfig(environment, true);
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout.trim())).toEqual({
      isProduction: true,
      nodeEnv: 'production',
      definedNodeEnv: '"production"',
    });
  });

  it('rejects vite-ssr config pollution even with --mode production', () => {
    const result = resolveBuildConfig();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('require NODE_ENV=production before vite-ssr');
  });

  it.each([
    'globalThis.__VUE_HMR_RUNTIME__ = {};',
    'globalThis.node.__vnode = globalThis.vnode;',
    'globalThis.node["__vueParentComponent"] = globalThis.component;',
  ])('rejects executable Vue development properties in minified chunks: %s', async (code) => {
    await expect(buildFixture(code)).rejects.toThrow(/Vue development runtime found/);
  });

  it('ignores ordinary strings, comments, and source map source content', async () => {
    const result = await buildFixture(`
      // globalThis.__VUE_HMR_RUNTIME__ = {};
      const unused = () => { globalThis.node.__vnode = {}; };
      console.log("__vnode", "globalThis.__VUE_HMR_RUNTIME__ = {}");
    `);
    expect(Array.isArray(result)).toBe(false);
    const output = (result as { output: Array<{ type: string; code?: string; source?: string }> }).output;
    expect(output.some((asset) => asset.type === 'asset' && String(asset.source).includes('__VUE_HMR_RUNTIME__'))).toBe(true);
  });
});
