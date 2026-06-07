# Home Page Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the demo `/` route with a real SSR RankLand home page backed by `RanklandApiService.getStatistics()` and full-chain E2E coverage.

**Architecture:** Add a small home URL helper, rewrite the home Vue route, remove the visible bwcx demo shell, copy two home card assets, and update SSR/E2E tests from demo assumptions to RankLand home behavior. Keep shared API service, generated routes, package manifests, and lockfile unchanged.

**Tech Stack:** Vue 3, bwcx-client-vue3 route views, vite-ssr async data, @vueuse/head, Vitest, Playwright full-chain E2E.

---

## File Structure

- Create `src/client/modules/home/home-site.ts`: site origin and absolute URL helper for home SEO metadata.
- Create `tests/unit/home-site.spec.ts`: helper coverage.
- Modify `src/client/modules/home/home.view.vue`: SSR home page, statistics loading, SEO head, JSON-LD, content sections.
- Modify `src/client/App.vue`: remove visible bwcx demo chrome and keep a minimal router shell.
- Modify `src/client/index.less`: replace demo global centering with RankLand-friendly page defaults.
- Copy `src/client/modules/home/assets/paste-then-ac_logo.png`.
- Copy `src/client/modules/home/assets/algo-bootstrap_logo.png`.
- Modify `tests/ssr/smoke.spec.ts`: mock `/api/statistics` and assert real home SSR HTML.
- Modify `tests/e2e/home.spec.ts`: shallow Vite smoke assertions for real home.
- Create `tests/e2e/full-chain/home.spec.ts`: full-chain SSR/hydration/API coverage for `/`.

## Task 1: Home Site URL Helper

**Files:**
- Create: `src/client/modules/home/home-site.ts`
- Create: `tests/unit/home-site.spec.ts`

- [ ] **Step 1: Write failing helper tests**

Create `tests/unit/home-site.spec.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest';
import { buildHomeAbsoluteUrl, getHomeSiteOrigin } from '@client/modules/home/home-site';

const originalEnv = {
  RANKLAND_SITE_ORIGIN: process.env.RANKLAND_SITE_ORIGIN,
  RANKLAND_SITE_ALIAS: process.env.RANKLAND_SITE_ALIAS,
  SITE_ALIAS: process.env.SITE_ALIAS,
};

function restoreEnv() {
  process.env.RANKLAND_SITE_ORIGIN = originalEnv.RANKLAND_SITE_ORIGIN;
  process.env.RANKLAND_SITE_ALIAS = originalEnv.RANKLAND_SITE_ALIAS;
  process.env.SITE_ALIAS = originalEnv.SITE_ALIAS;
}

describe('home site helpers', () => {
  afterEach(() => {
    restoreEnv();
  });

  it('uses the explicit RankLand site origin when provided', () => {
    process.env.RANKLAND_SITE_ORIGIN = 'https://rankland.example';
    process.env.RANKLAND_SITE_ALIAS = 'cnn';

    expect(getHomeSiteOrigin()).toBe('https://rankland.example');
    expect(buildHomeAbsoluteUrl('/search?kw={search_term_string}')).toBe(
      'https://rankland.example/search?kw={search_term_string}',
    );
  });

  it('uses the China origin for the cnn site alias', () => {
    delete process.env.RANKLAND_SITE_ORIGIN;
    process.env.RANKLAND_SITE_ALIAS = 'cnn';
    delete process.env.SITE_ALIAS;

    expect(getHomeSiteOrigin()).toBe('https://rl.algoux.cn');
  });

  it('falls back to the global RankLand origin', () => {
    delete process.env.RANKLAND_SITE_ORIGIN;
    delete process.env.RANKLAND_SITE_ALIAS;
    delete process.env.SITE_ALIAS;

    expect(getHomeSiteOrigin()).toBe('https://rl.algoux.org');
    expect(buildHomeAbsoluteUrl('collection/official')).toBe('https://rl.algoux.org/collection/official');
  });
});
```

- [ ] **Step 2: Run helper tests and verify they fail**

Run:

```bash
corepack pnpm test:unit -- tests/unit/home-site.spec.ts
```

Expected: FAIL because `@client/modules/home/home-site` does not exist.

- [ ] **Step 3: Implement helper**

Create `src/client/modules/home/home-site.ts`:

```ts
const DEFAULT_SITE_ORIGIN = 'https://rl.algoux.org';
const CNN_SITE_ORIGIN = 'https://rl.algoux.cn';

export function getHomeSiteOrigin(): string {
  if (process.env.RANKLAND_SITE_ORIGIN) {
    return process.env.RANKLAND_SITE_ORIGIN.replace(/\/$/, '');
  }

  const alias = process.env.RANKLAND_SITE_ALIAS || process.env.SITE_ALIAS;
  return alias === 'cnn' ? CNN_SITE_ORIGIN : DEFAULT_SITE_ORIGIN;
}

export function buildHomeAbsoluteUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getHomeSiteOrigin()}${normalizedPath}`;
}
```

- [ ] **Step 4: Run helper tests and verify they pass**

Run:

```bash
corepack pnpm test:unit -- tests/unit/home-site.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit helper work**

Run:

```bash
git add src/client/modules/home/home-site.ts tests/unit/home-site.spec.ts
git commit -m "test: 补充首页站点链接辅助逻辑"
```

## Task 2: Home Full-Chain E2E Contract

**Files:**
- Create: `tests/e2e/full-chain/home.spec.ts`

- [ ] **Step 1: Write failing full-chain home test**

Create `tests/e2e/full-chain/home.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { denyExternalCalls } from '../helpers/mock-api';

const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;

test.describe('/ full-chain route', () => {
  test('renders the RankLand home page through SSR, hydration, RanklandApiService, and the mock backend', async ({
    page,
    request,
  }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    const html = await response!.text();
    expect(html).toContain('欢迎来到 RankLand');
    expect(html).toContain('1234');
    expect(html).toContain('56789');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('https://rl.algoux.org/search?kw={search_term_string}');
    await expect(page).toHaveTitle('RankLand');
    await expect(page.locator('[data-id="home-content"]')).toBeVisible();
    await expect(page.locator('[data-id="home-total-srk-count"]')).toHaveText('1234');
    await expect(page.locator('[data-id="home-total-view-count"]')).toHaveText('56789');
    await expect(page.locator('[data-id="home-recommendation-search"][href="/search"]')).toBeVisible();
    await expect(page.locator('[data-id="home-recommendation-collection"][href="/collection/official"]')).toBeVisible();
    await expect(page.locator('[data-id="home-hydrated"]')).toHaveText('hydrated');

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string }>;
    const statisticsRequests = requests.filter((requestRecord) => requestRecord.path === '/statistics');

    expect(statisticsRequests).toHaveLength(1);
    expect(requests.some((requestRecord) => requestRecord.path === '/rank/listall')).toBe(false);
    expect(requests.some((requestRecord) => requestRecord.path === '/rank/search')).toBe(false);
    expect(requests.some((requestRecord) => requestRecord.path === '/rank/test-key')).toBe(false);
    expect(requests.some((requestRecord) => requestRecord.path === '/file/download')).toBe(false);
  });
});
```

- [ ] **Step 2: Run full-chain home test and verify it fails**

Run:

```bash
corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/home.spec.ts
```

Expected: FAIL because `/` still renders the bwcx demo home and does not request `/statistics`.

- [ ] **Step 3: Commit failing contract test only after implementation is ready**

Do not commit a permanently failing test. Keep it in the worktree until Task 4 makes it pass.

## Task 3: SSR And Shallow E2E Tests

**Files:**
- Modify: `tests/ssr/smoke.spec.ts`
- Modify: `tests/e2e/home.spec.ts`

- [ ] **Step 1: Update SSR smoke mock and assertions**

Modify the smoke XHR mock in `tests/ssr/smoke.spec.ts` so `GET /api/statistics` returns:

```ts
{
  code: 0,
  message: 'success',
  data: {
    totalSrkCount: 1234,
    totalViewCount: 56789,
  },
}
```

Update the home smoke assertion to require `result.html` contains:

```text
欢迎来到 RankLand
```

- [ ] **Step 2: Update shallow Playwright home smoke**

Modify `tests/e2e/home.spec.ts` to assert:

```ts
await expect(page.locator('[data-id="home-content"]')).toBeVisible();
await expect(page.getByRole('heading', { name: '欢迎来到 RankLand' })).toBeVisible();
await expect(page.locator('[data-id="home-total-srk-count"]')).toHaveText('1234');
await expect(page.locator('[data-id="home-recommendation-search"][href="/search"]')).toBeVisible();
await expect(page.locator('[data-id="home-recommendation-collection"][href="/collection/official"]')).toBeVisible();
```

Remove demo assertions for `Welcome to bwcx Demo`, `This is the Home Page.`, and `demo1`.

- [ ] **Step 3: Run SSR and shallow E2E and verify they fail before implementation**

Run:

```bash
corepack pnpm test:ssr
corepack pnpm test:e2e
```

Expected: FAIL until the home page implementation replaces the demo route.

## Task 4: Implement Home Page And Minimal Shell

**Files:**
- Modify: `src/client/modules/home/home.view.vue`
- Modify: `src/client/App.vue`
- Modify: `src/client/index.less`
- Copy assets into `src/client/modules/home/assets/`

- [ ] **Step 1: Copy home card assets**

Copy:

```bash
mkdir -p src/client/modules/home/assets
cp /Users/cooper/Projects/RankLand/rankland-fe/src/assets/paste-then-ac_logo.png src/client/modules/home/assets/paste-then-ac_logo.png
cp /Users/cooper/Projects/RankLand/rankland-fe/src/assets/algo-bootstrap_logo.png src/client/modules/home/assets/algo-bootstrap_logo.png
```

- [ ] **Step 2: Replace demo App shell**

Modify `src/client/App.vue` to keep only a minimal router shell:

```vue
<template>
  <router-view v-slot="{ Component }">
    <Suspense>
      <component :is="Component" />
    </Suspense>
  </router-view>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'App',
});
</script>
```

- [ ] **Step 3: Replace global demo styles**

Modify `src/client/index.less` to remove `#app` centered demo styling and use neutral page defaults.

- [ ] **Step 4: Rewrite `home.view.vue`**

Implement the real home route using `ranklandApiService.getStatistics()`, `<Head>` metadata, JSON-LD scripts, content sections, and `home-hydrated` marker.

- [ ] **Step 5: Run focused verification**

Run:

```bash
corepack pnpm test:unit -- tests/unit/home-site.spec.ts
corepack pnpm test:ssr
corepack pnpm test:e2e
corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/home.spec.ts
```

Expected: all pass.

- [ ] **Step 6: Commit implementation and tests**

Run:

```bash
git add src/client/modules/home src/client/App.vue src/client/index.less tests/ssr/smoke.spec.ts tests/e2e/home.spec.ts tests/e2e/full-chain/home.spec.ts
git commit -m "feat: 迁移首页基础视图"
```

## Task 5: Final Migration Gate

**Files:**
- Read-only verification.

- [ ] **Step 1: Run full migration gate**

Run:

```bash
corepack pnpm test:migration
```

Expected: PASS.

- [ ] **Step 2: Inspect branch state**

Run:

```bash
git status --short --branch
git log --oneline -5
```

Expected: clean branch with latest home-page commits.

- [ ] **Step 3: Record final handoff**

Final handoff must include:

- branch name;
- latest commit;
- completed home scope;
- exact verification commands and results;
- Node and pnpm versions;
- skipped gates, if any;
- remaining risks and next recommended slice.

## Self-Review Checklist

- The plan keeps shared API service, generated routes, package manifest, lockfile, and broad config untouched.
- Tests are written before production implementation.
- Full-chain assertions prove SSR, hydration, and RankLand API service wiring.
- App shell change is scoped to removing demo chrome, not implementing the full old layout.
- Contact modal and full Beian parity are explicitly deferred in the spec.
