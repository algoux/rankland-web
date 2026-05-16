# RankLand Vue Migration Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the dependency compatibility baseline and migration harness needed before porting RankLand pages from React/Umi to Vue/bwcx.

**Architecture:** Keep the existing bwcx + vite-ssr application structure. Upgrade Vue only as far as required by the Vue SRK renderer, add Ant Design Vue as the migration UI bridge, then add tests and fixtures that can protect every later page migration.

**Tech Stack:** Vue 3, bwcx, vite-ssr, ant-design-vue, `@algoux/standard-ranklist-renderer-component-vue`, Vitest, Playwright, MSW.

---

## Scope

This plan covers only the first migration foundation slice:

- Dependency compatibility for Vue SRK renderer and Ant Design Vue.
- Test harness foundation.
- Migration fixtures and mock API helper.
- SSR smoke test scaffolding.
- E2E scaffolding that can run against the existing app and later migrated pages.

This plan does not migrate RankLand product pages. Page routes, API service migration, SRK wrapper migration, collection migration, playground migration, and live migration each need their own later plan.

## Files

Modify:

- `package.json`
- `vite.config.js`
- `tsconfig.json`

Create:

- `vitest.config.ts`
- `tests/setup/vitest.setup.ts`
- `tests/fixtures/ranklist.srk.json`
- `tests/fixtures/collection.json`
- `tests/fixtures/live-info.json`
- `tests/fixtures/listall.json`
- `tests/fixtures/statistics.json`
- `tests/fixtures/ranklist-info.json`
- `tests/unit/env.spec.ts`
- `tests/ssr/smoke.spec.ts`
- `tests/e2e/helpers/mock-api.ts`
- `tests/e2e/home.spec.ts`
- `playwright.config.ts`
- `docs/migration/inventory.md`
- `docs/migration/api-contract.md`

Generated or updated by commands:

- `pnpm-lock.yaml`
- `src/client/router/routes.ts`
- `src/client/router/types.d.ts`
- `src/common/router/client-routes.ts`

## Task 1: Update Dependency And Script Baseline

**Files:**

- Modify: `package.json`
- Generated: `pnpm-lock.yaml`

- [ ] **Step 1: Edit `package.json` scripts**

Replace the current `scripts` block with this block:

```json
{
  "preinstall": "npx only-allow pnpm",
  "test": "pnpm test:unit",
  "test:unit": "vitest run",
  "test:unit:watch": "vitest",
  "test:ssr": "vitest run tests/ssr",
  "test:e2e": "playwright test",
  "test:migration": "pnpm test:unit && pnpm test:ssr && pnpm test:e2e",
  "init": "pnpm i --frozen-lockfile",
  "gen:client-router": "node scripts/client-routes.gen.js",
  "dev:start": "cross-env NODE_ENV=development tsnd --respawn --rs --transpile-only -P src/server/tsconfig.json --unhandled-rejections=warn --inspect=127.0.0.1:9232 src/server/index.ts",
  "dev": "concurrently -r \"npm:dev:start\" \"npm:gen:client-router\"",
  "gen:proto": "pbjs -t static-module -w commonjs -r rankland_live_contest_client --force-long -o src/common/proto/rankland_live_contest.js src/common/shared/proto/rankland_live_contest/*.proto && pbts -o src/common/proto/rankland_live_contest.d.ts src/common/proto/rankland_live_contest.js",
  "build:client": "rimraf dist && vite-ssr build --ssr src/client/entry-server.ts",
  "build:server": "rimraf app && tsc -p src/server/tsconfig.json && copyfiles -u1 \"src/**/*.js\" app",
  "build": "pnpm run build:client && pnpm run build:server",
  "start": "cross-env NODE_ENV=production node --unhandled-rejections=warn app/server/index.js",
  "deploy": "cross-env NODE_ENV=production pm2 start pm2.config.js",
  "deploy:foreground": "cross-env NODE_ENV=production pm2-runtime pm2.config.js"
}
```

- [ ] **Step 2: Edit `package.json` dependencies**

Update or add these dependency entries:

```json
{
  "@algoux/standard-ranklist": "^0.3.11",
  "@algoux/standard-ranklist-renderer-component-core": "0.5.1",
  "@algoux/standard-ranklist-renderer-component-styles": "0.5.1",
  "@algoux/standard-ranklist-renderer-component-vue": "0.5.1",
  "@algoux/standard-ranklist-utils": "^0.2.9",
  "@vue/runtime-core": "^3.4.0",
  "@vue/server-renderer": "^3.4.0",
  "ant-design-vue": "^4.2.6",
  "vue": "^3.4.0"
}
```

Keep existing dependencies that are not listed here unchanged.

- [ ] **Step 3: Edit `package.json` devDependencies**

Add these dev dependency entries:

```json
{
  "@playwright/test": "^1.42.1",
  "@vitest/coverage-v8": "^1.6.1",
  "jsdom": "^24.1.1",
  "msw": "^2.6.8",
  "vitest": "^1.6.1"
}
```

Keep existing dev dependencies that are not listed here unchanged.

- [ ] **Step 4: Install dependencies**

Run:

```bash
pnpm install
```

Expected:

```text
Done
```

If `pnpm install` reports a peer dependency conflict involving Vue, keep the package versions from this task and record the exact conflict in the task notes before adjusting any other dependency.

- [ ] **Step 5: Commit dependency baseline**

Run:

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add Vue migration foundation dependencies"
```

Expected:

```text
[migration/vue-spec-coding ...] chore: add Vue migration foundation dependencies
```

## Task 2: Verify Vue And SSR Compatibility

**Files:**

- Modify: `vite.config.js`
- Generated: `src/client/router/routes.ts`
- Generated: `src/client/router/types.d.ts`
- Generated: `src/common/router/client-routes.ts`

- [ ] **Step 1: Run route generation once**

Run:

```bash
pnpm run gen:client-router
```

Expected:

```text
Generated 3 client route(s)
```

Stop the watcher with `Ctrl+C` after the generated message appears.

- [ ] **Step 2: Run client and server build**

Run:

```bash
pnpm run build
```

Expected:

```text
Done
```

The build must produce:

```text
dist/client
dist/server
app/server/index.js
```

- [ ] **Step 3: If Vue 3.4 exposes a Vite 2 plugin incompatibility, patch `vite.config.js`**

Only apply this step if the build error mentions Vue SFC transform, Vue compiler, or `@vitejs/plugin-vue`.

Update the Vue plugin import and plugin order to this shape:

```js
const { defineConfig } = require('vite');
const path = require('path');
const viteSSR = require('vite-ssr/plugin');
const vue = require('@vitejs/plugin-vue');

const isProd = process.env.NODE_ENV === 'production';

module.exports = defineConfig({
  server: {
    fs: {
      strict: false,
    },
  },
  base: isProd ? '/dist/' : undefined,
  define: {
    'process.env': {
      BWCX_RUNTIME_SCOPE: 'client',
    },
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
```

Then rerun:

```bash
pnpm run build
```

Expected:

```text
Done
```

- [ ] **Step 4: Commit compatibility verification**

Run:

```bash
git add vite.config.js src/client/router/routes.ts src/client/router/types.d.ts src/common/router/client-routes.ts
git commit -m "chore: verify Vue SSR compatibility"
```

Expected:

```text
[migration/vue-spec-coding ...] chore: verify Vue SSR compatibility
```

If `vite.config.js` and generated route files have no diff, skip this commit and record that build compatibility required no source changes.

## Task 3: Add Vitest Harness

**Files:**

- Create: `vitest.config.ts`
- Create: `tests/setup/vitest.setup.ts`
- Create: `tests/unit/env.spec.ts`
- Modify: `tsconfig.json`

- [ ] **Step 1: Add `vitest.config.ts`**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    include: ['tests/unit/**/*.spec.ts', 'tests/ssr/**/*.spec.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@server': path.resolve(__dirname, './src/server'),
      '@common': path.resolve(__dirname, './src/common'),
      '@client': path.resolve(__dirname, './src/client'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
```

- [ ] **Step 2: Add Vitest setup file**

Create `tests/setup/vitest.setup.ts`:

```ts
import { afterEach, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
});
```

- [ ] **Step 3: Add harness environment test**

Create `tests/unit/env.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';

describe('migration test harness', () => {
  it('runs TypeScript tests with project aliases available', async () => {
    const mod = await import('@common/enums/err-code.enum');
    expect(mod.ErrCode).toBeDefined();
  });
});
```

- [ ] **Step 4: Update `tsconfig.json` path aliases for tests**

Add `@tests/*` to `compilerOptions.paths`:

```json
{
  "compilerOptions": {
    "paths": {
      "@server/*": ["./src/server/*"],
      "@common/*": ["./src/common/*"],
      "@client/*": ["./src/client/*"],
      "@tests/*": ["./tests/*"]
    }
  }
}
```

Do not remove existing compiler options.

- [ ] **Step 5: Run unit tests**

Run:

```bash
pnpm test:unit
```

Expected:

```text
1 passed
```

- [ ] **Step 6: Commit Vitest harness**

Run:

```bash
git add vitest.config.ts tests/setup/vitest.setup.ts tests/unit/env.spec.ts tsconfig.json
git commit -m "test: add Vitest migration harness"
```

Expected:

```text
[migration/vue-spec-coding ...] test: add Vitest migration harness
```

## Task 4: Copy Migration Fixtures

**Files:**

- Create: `tests/fixtures/ranklist.srk.json`
- Create: `tests/fixtures/collection.json`
- Create: `tests/fixtures/live-info.json`
- Create: `tests/fixtures/listall.json`
- Create: `tests/fixtures/statistics.json`
- Create: `tests/fixtures/ranklist-info.json`

- [ ] **Step 1: Copy fixture files from `rankland-fe`**

Run:

```bash
mkdir -p tests/fixtures
cp ../rankland-fe/tests/fixtures/ranklist.srk.json tests/fixtures/ranklist.srk.json
cp ../rankland-fe/tests/fixtures/collection.json tests/fixtures/collection.json
cp ../rankland-fe/tests/fixtures/live-info.json tests/fixtures/live-info.json
cp ../rankland-fe/tests/fixtures/listall.json tests/fixtures/listall.json
cp ../rankland-fe/tests/fixtures/statistics.json tests/fixtures/statistics.json
cp ../rankland-fe/tests/fixtures/ranklist-info.json tests/fixtures/ranklist-info.json
```

- [ ] **Step 2: Verify fixture JSON parses**

Run:

```bash
node -e "for (const f of ['ranklist.srk.json','collection.json','live-info.json','listall.json','statistics.json','ranklist-info.json']) JSON.parse(require('fs').readFileSync('tests/fixtures/' + f, 'utf8')); console.log('fixtures ok')"
```

Expected:

```text
fixtures ok
```

- [ ] **Step 3: Commit fixtures**

Run:

```bash
git add tests/fixtures
git commit -m "test: add RankLand migration fixtures"
```

Expected:

```text
[migration/vue-spec-coding ...] test: add RankLand migration fixtures
```

## Task 5: Add SSR Smoke Test Harness

**Files:**

- Create: `tests/ssr/smoke.spec.ts`

- [ ] **Step 1: Add SSR smoke test**

Create `tests/ssr/smoke.spec.ts`:

```ts
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const distDir = path.resolve(__dirname, '..', '..', 'dist');
const serverEntryPath = path.join(distDir, 'server', 'index.js');
const clientIndexPath = path.join(distDir, 'client', 'index.html');

const hasBuild = fs.existsSync(serverEntryPath) && fs.existsSync(clientIndexPath);
const suite = hasBuild ? describe : describe.skip;

suite('SSR smoke harness', () => {
  it('renders the existing home route from the built vite-ssr server bundle', async () => {
    const renderModule = await import(serverEntryPath);
    const render = renderModule.default || renderModule;
    const htmlTemplate = fs.readFileSync(clientIndexPath, 'utf-8');

    const result = await render('http://localhost:3000/', {
      request: {
        headers: {
          host: 'localhost:3000',
        },
      },
      response: {},
      template: htmlTemplate,
      manifest: {},
      preload: false,
    });

    expect(result).toBeTruthy();
    expect(typeof result.html).toBe('string');
    expect(result.html).toContain('<!DOCTYPE html>');
  });
});
```

- [ ] **Step 2: Verify SSR test skips before build**

Run:

```bash
pnpm test:ssr
```

Expected:

```text
1 skipped
```

- [ ] **Step 3: Build the app**

Run:

```bash
pnpm run build
```

Expected:

```text
Done
```

- [ ] **Step 4: Verify SSR smoke passes after build**

Run:

```bash
pnpm test:ssr
```

Expected:

```text
1 passed
```

- [ ] **Step 5: Commit SSR harness**

Run:

```bash
git add tests/ssr/smoke.spec.ts
git commit -m "test: add SSR smoke harness"
```

Expected:

```text
[migration/vue-spec-coding ...] test: add SSR smoke harness
```

## Task 6: Add Playwright Harness And Mock API Helper

**Files:**

- Create: `playwright.config.ts`
- Create: `tests/e2e/helpers/mock-api.ts`
- Create: `tests/e2e/home.spec.ts`

- [ ] **Step 1: Add Playwright config**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm run dev:start',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 2: Add mock API helper**

Create `tests/e2e/helpers/mock-api.ts`:

```ts
import type { Page, Route } from '@playwright/test';
import collection from '../../fixtures/collection.json';
import listall from '../../fixtures/listall.json';
import liveInfo from '../../fixtures/live-info.json';
import ranklistInfo from '../../fixtures/ranklist-info.json';
import srk from '../../fixtures/ranklist.srk.json';
import statistics from '../../fixtures/statistics.json';

function ok(data: unknown) {
  return { code: 0, message: 'success', data };
}

async function fulfillJson(route: Route, data: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(data),
  });
}

export async function installApiMocks(page: Page) {
  await page.route(/\/api\/rank\/listall(?:\?.*)?$/, (route) => fulfillJson(route, ok(listall)));
  await page.route(/\/api\/rank\/search(?:\?.*)?$/, (route) => fulfillJson(route, ok(listall)));
  await page.route(/\/api\/statistics(?:\?.*)?$/, (route) => fulfillJson(route, ok(statistics)));
  await page.route(/\/api\/rank\/group\/[^/?]+(?:\?.*)?$/, (route) =>
    fulfillJson(route, ok({ content: JSON.stringify(collection) })),
  );
  await page.route(/\/api\/file\/download(?:\?.*)?$/, (route) => fulfillJson(route, srk));
  await page.route(/\/api\/ranking\/config\/[^/?]+(?:\?.*)?$/, (route) => fulfillJson(route, ok(liveInfo)));
  await page.route(/\/api\/ranking\/[^/?]+(?:\?.*)?$/, (route) => fulfillJson(route, ok(srk)));
  await page.route(/\/api\/rank\/[^/?]+(?:\?.*)?$/, (route) => fulfillJson(route, ok(ranklistInfo)));
}

export async function denyExternalCalls(page: Page) {
  await page.route(/^https?:\/\/(?!(127\.0\.0\.1|localhost)(:\d+)?\/).*/, (route) =>
    route.abort('blockedbyclient'),
  );
}

export async function stubWebSocket(page: Page) {
  await page.addInitScript(() => {
    class StubWebSocket extends EventTarget {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;

      binaryType = 'arraybuffer';
      readyState = StubWebSocket.OPEN;
      url: string;

      constructor(url: string) {
        super();
        this.url = url;
        setTimeout(() => this.dispatchEvent(new Event('open')), 0);
      }

      close() {
        this.readyState = StubWebSocket.CLOSED;
        this.dispatchEvent(new Event('close'));
      }

      send() {}
    }

    window.WebSocket = StubWebSocket as unknown as typeof WebSocket;
  });
}
```

- [ ] **Step 3: Add a minimal current-app E2E test**

Create `tests/e2e/home.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { denyExternalCalls, installApiMocks } from './helpers/mock-api';

test.describe('current app smoke', () => {
  test('renders the existing home route', async ({ page }) => {
    await denyExternalCalls(page);
    await installApiMocks(page);

    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('#app')).toBeVisible();
  });
});
```

- [ ] **Step 4: Run E2E harness**

Run:

```bash
pnpm test:e2e
```

Expected:

```text
1 passed
```

- [ ] **Step 5: Commit E2E harness**

Run:

```bash
git add playwright.config.ts tests/e2e/helpers/mock-api.ts tests/e2e/home.spec.ts
git commit -m "test: add Playwright migration harness"
```

Expected:

```text
[migration/vue-spec-coding ...] test: add Playwright migration harness
```

## Task 7: Add Migration Documentation Harness

**Files:**

- Create: `docs/migration/inventory.md`
- Create: `docs/migration/api-contract.md`

- [ ] **Step 1: Add migration inventory**

Create `docs/migration/inventory.md`:

```md
# RankLand Migration Inventory

## Public Routes

| Route | Source file | Target module | Render method |
| --- | --- | --- | --- |
| `/` | `rankland-fe/src/pages/index.tsx` | `src/client/modules/home/home.view.vue` | SSR |
| `/search` | `rankland-fe/src/pages/search/index.tsx` | `src/client/modules/search/search.view.vue` | CSR |
| `/ranklist/:id` | `rankland-fe/src/pages/ranklist/[id].tsx` | `src/client/modules/ranklist/ranklist.view.vue` | SSR |
| `/collection/:id` | `rankland-fe/src/pages/collection/[id].tsx` | `src/client/modules/collection/collection.view.vue` | SSR |
| `/playground` | `rankland-fe/src/pages/playground/index.tsx` | `src/client/modules/playground/playground.view.vue` | CSR |
| `/live/:id` | `rankland-fe/src/pages/live/[id].tsx` | `src/client/modules/live/live.view.vue` | CSR |

## Shared Source Components

| Source file | Migration target |
| --- | --- |
| `src/layouts/index.tsx` | Vue app shell |
| `src/layouts/NavMenu.tsx` | Vue navigation component |
| `src/layouts/RightMenu.tsx` | Vue right menu component |
| `src/components/StyledRanklist.tsx` | Vue SRK validation wrapper |
| `src/components/StyledRanklistRenderer.tsx` | Vue SRK renderer wrapper |
| `src/components/SrkPlayground.tsx` | Vue playground component |
| `src/components/UserInfoModal.tsx` | Vue user modal integration |
| `src/components/plugins/ScrollSolution/ScrollSolution.tsx` | Vue live scroll-solution component |

## Shared Source Utilities

| Source file | Migration target |
| --- | --- |
| `src/utils/title-format.util.ts` | `src/client/utils/title-format.util.ts` |
| `src/utils/time-format.util.ts` | `src/client/utils/time-format.util.ts` |
| `src/utils/srk-asset.util.ts` | `src/client/utils/srk-asset.util.ts` |
| `src/utils/mini-cache.util.ts` | `src/client/utils/mini-cache.util.ts` |
| `src/utils/ranklist.util.ts` | `src/client/utils/ranklist.util.ts` |
| `src/utils/rank-time-data.util.ts` | `src/client/utils/rank-time-data.util.ts` |
| `src/utils/realtime-solutions.util.ts` | `src/client/utils/realtime-solutions.util.ts` |
```

- [ ] **Step 2: Add API contract document**

Create `docs/migration/api-contract.md`:

```md
# RankLand Upstream API Contract

## Normal API

| Method | HTTP path | Response |
| --- | --- | --- |
| `getStatistics` | `GET /statistics` | `{ totalSrkCount, totalViewCount }` |
| `listAllRanklists` | `GET /rank/listall` | `{ ranks }` |
| `searchRanklist` | `GET /rank/search?query=:kw` | `{ ranks }` |
| `getLiveRanklistInfo` | `GET /ranking/config/:uniqueKey` | live contest info |
| `getLiveRanklist` | `GET /ranking/:id` | SRK ranklist |

## CDN API

| Method | HTTP path | Response |
| --- | --- | --- |
| `getRanklistInfo` | `GET /rank/:key` | ranklist info |
| `getSrkFile` | `GET /file/download?id=:fileID` | SRK JSON |
| `getCollection` | `GET /rank/group/:key` | `{ content: stringifiedCollectionJson }` |

## Error Mapping

| Upstream condition | Target behavior |
| --- | --- |
| Wrapped response `code === 0` | Return `data` |
| Wrapped response `code === 11` | Throw RankLand NotFound logic exception |
| HTTP `404` | Throw RankLand NotFound logic exception |
| Other wrapped API error | Throw API exception with code and message |
| Other HTTP error | Throw HTTP exception with status and status text |
```

- [ ] **Step 3: Commit migration documentation harness**

Run:

```bash
git add docs/migration/inventory.md docs/migration/api-contract.md
git commit -m "docs: add migration harness inventory"
```

Expected:

```text
[migration/vue-spec-coding ...] docs: add migration harness inventory
```

## Task 8: Run Foundation Gate

**Files:**

- No new source files.

- [ ] **Step 1: Confirm branch and status**

Run:

```bash
git status --short --branch
```

Expected:

```text
## migration/vue-spec-coding
```

- [ ] **Step 2: Run route generation**

Run:

```bash
pnpm run gen:client-router
```

Expected:

```text
Generated 3 client route(s)
```

Stop the watcher with `Ctrl+C` after the generated message appears.

- [ ] **Step 3: Run build**

Run:

```bash
pnpm run build
```

Expected:

```text
Done
```

- [ ] **Step 4: Run unit tests**

Run:

```bash
pnpm test:unit
```

Expected:

```text
1 passed
```

- [ ] **Step 5: Run SSR tests**

Run:

```bash
pnpm test:ssr
```

Expected:

```text
1 passed
```

- [ ] **Step 6: Run E2E tests**

Run:

```bash
pnpm test:e2e
```

Expected:

```text
1 passed
```

- [ ] **Step 7: Run complete migration harness**

Run:

```bash
pnpm test:migration
```

Expected:

```text
1 passed
```

from each test layer.

- [ ] **Step 8: Confirm clean working tree**

Run:

```bash
git status --short
```

Expected output is empty.

## Execution Notes

If Task 1 dependency installation shows that Vue 3.4 is incompatible with the existing Vite 2/vite-ssr/class-component stack, stop after recording the exact error. The next plan must address that compatibility break before continuing with page migration.

If Playwright cannot install or run browsers in the local environment, keep the Playwright config and tests committed, then record the command failure and skip only the browser execution gate for this foundation pass.

If the dev server cannot start because MongoDB is not available, update `playwright.config.ts` in the implementation task to use a prestarted `E2E_BASE_URL` and run E2E against an already running server. Do not weaken the E2E assertions.
