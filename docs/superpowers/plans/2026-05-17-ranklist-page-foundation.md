# Ranklist Page Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first real RankLand visible route, `/ranklist/:id`, with SSR data loading through `RanklandApiService`, minimal Vue SRK rendering, NotFound handling, and full-chain E2E coverage.

**Architecture:** Add a small title/error helper, a minimal SRK renderer wrapper, and a thin SSR route module. Verify the route through generated bwcx route maps and through the existing full-chain Playwright harness that drives the real bwcx/Koa server into the controlled RankLand API backend.

**Tech Stack:** Node 24 LTS, pnpm 8, Vue 3 Options API, vite-ssr, bwcx-client-vue3, `@vueuse/head`, `RanklandApiService`, `@algoux/standard-ranklist-renderer-component-vue`, Vitest, Playwright full-chain E2E.

---

## Source Spec

- Design spec: `docs/superpowers/specs/2026-05-16-ranklist-page-foundation-design.md`
- Branch: `migration/ranklist-page-foundation`
- Base branch: `migration/node-24-lts`
- Do not merge.
- Do not push.
- All commits are local only.

## File Structure

- `src/client/utils/title-format.util.ts`: shared RankLand page title formatting.
- `src/client/modules/ranklist/ranklist-error.ts`: serializable page-level ranklist load error classifier.
- `src/client/components/rankland-ranklist.vue`: minimal SSR-compatible wrapper around the Vue SRK renderer package.
- `src/client/modules/ranklist/ranklist.view.vue`: public `/ranklist/:id` SSR route that calls `RanklandApiService.getRanklist`.
- `src/client/router/routes.ts`: generated client route file, updated to include `Ranklist`.
- `src/client/router/types.d.ts`: generated router type declarations, updated to include `Ranklist`.
- `src/common/router/client-routes.ts`: generated common route map, updated to include `Ranklist`.
- `tests/unit/title-format.spec.ts`: title helper tests.
- `tests/unit/ranklist-error.spec.ts`: serializable ranklist error classification tests.
- `tests/unit/client-routes.spec.ts`: client route registry assertions for `/ranklist/:id`.
- `tests/unit/e2e-client-routes.spec.ts`: server route map assertions for `/ranklist/:id`.
- `tests/e2e/support/start-full-chain-e2e.js`: controlled backend missing-rank branch for NotFound full-chain tests.
- `tests/e2e/full-chain/ranklist.spec.ts`: full-chain visible route E2E tests.

---

## Task 1: Title Formatting And Ranklist Error Classification

**Files:**

- Create: `src/client/utils/title-format.util.ts`
- Create: `src/client/modules/ranklist/ranklist-error.ts`
- Create: `tests/unit/title-format.spec.ts`
- Create: `tests/unit/ranklist-error.spec.ts`

- [ ] **Step 1: Write failing title helper tests**

Create `tests/unit/title-format.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { formatTitle } from '@client/utils/title-format.util';

describe('formatTitle', () => {
  it('returns the site name when no page title is provided', () => {
    expect(formatTitle()).toBe('RankLand');
    expect(formatTitle('')).toBe('RankLand');
    expect(formatTitle('   ')).toBe('RankLand');
  });

  it('formats a page title with the RankLand suffix', () => {
    expect(formatTitle('Test Contest 2024')).toBe('Test Contest 2024 - RankLand');
  });
});
```

- [ ] **Step 2: Write failing ranklist error classification tests**

Create `tests/unit/ranklist-error.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { RanklandLogicException, RanklandLogicExceptionKind } from '@common/rankland-api';
import { classifyRanklistLoadError } from '@client/modules/ranklist/ranklist-error';

describe('classifyRanklistLoadError', () => {
  it('classifies RankLand NotFound as a serializable not-found state', () => {
    expect(classifyRanklistLoadError(new RanklandLogicException(RanklandLogicExceptionKind.NotFound))).toEqual({
      kind: 'not-found',
      message: 'Ranklist Not Found',
    });
  });

  it('classifies other errors as a serializable generic state', () => {
    expect(classifyRanklistLoadError(new Error('boom'))).toEqual({
      kind: 'generic',
      message: 'An error occurred while loading data',
    });
  });
});
```

- [ ] **Step 3: Run the new tests and verify they fail**

Run:

```bash
fnm exec --using v24.11.1 corepack pnpm test:unit -- tests/unit/title-format.spec.ts tests/unit/ranklist-error.spec.ts
```

Expected: FAIL because `@client/utils/title-format.util` and `@client/modules/ranklist/ranklist-error` do not exist yet.

- [ ] **Step 4: Implement the title helper**

Create `src/client/utils/title-format.util.ts`:

```ts
const SITE_NAME = 'RankLand';

export function formatTitle(title?: string): string {
  const normalizedTitle = title?.trim();

  if (!normalizedTitle) {
    return SITE_NAME;
  }

  return `${normalizedTitle} - ${SITE_NAME}`;
}
```

- [ ] **Step 5: Implement the ranklist error classifier**

Create `src/client/modules/ranklist/ranklist-error.ts`:

```ts
import { RanklandLogicException, RanklandLogicExceptionKind } from '@common/rankland-api';

export type RanklistLoadErrorKind = 'not-found' | 'generic';

export interface RanklistLoadErrorState {
  kind: RanklistLoadErrorKind;
  message: string;
}

export function classifyRanklistLoadError(error: unknown): RanklistLoadErrorState {
  if (error instanceof RanklandLogicException && error.kind === RanklandLogicExceptionKind.NotFound) {
    return {
      kind: 'not-found',
      message: 'Ranklist Not Found',
    };
  }

  return {
    kind: 'generic',
    message: 'An error occurred while loading data',
  };
}
```

- [ ] **Step 6: Run the new tests and verify they pass**

Run:

```bash
fnm exec --using v24.11.1 corepack pnpm test:unit -- tests/unit/title-format.spec.ts tests/unit/ranklist-error.spec.ts
```

Expected: PASS with both new spec files passing.

- [ ] **Step 7: Commit Task 1**

Run:

```bash
git add src/client/utils/title-format.util.ts src/client/modules/ranklist/ranklist-error.ts tests/unit/title-format.spec.ts tests/unit/ranklist-error.spec.ts
git commit -m "feat: add ranklist page title and error helpers"
```

Expected: local commit only, no push.

---

## Task 2: Minimal Vue Ranklist Renderer Wrapper

**Files:**

- Create: `src/client/components/rankland-ranklist.vue`
- Modify: `package.json` only if build proves the package import path in the existing dependency set is wrong. Do not add dependencies unless the existing renderer packages cannot be imported.

- [ ] **Step 1: Create the minimal renderer wrapper**

Create `src/client/components/rankland-ranklist.vue`:

```vue
<template>
  <div class="rankland-ranklist">
    <Ranklist :data="staticRanklist" striped-rows />
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type * as srk from '@algoux/standard-ranklist';
import { convertToStaticRanklist } from '@algoux/standard-ranklist-renderer-component-core';
import { Ranklist } from '@algoux/standard-ranklist-renderer-component-vue';
import '@algoux/standard-ranklist-renderer-component-styles';

export default defineComponent({
  name: 'RanklandRanklist',
  components: {
    Ranklist,
  },
  props: {
    ranklist: {
      type: Object as PropType<srk.Ranklist>,
      required: true,
    },
  },
  computed: {
    staticRanklist() {
      return convertToStaticRanklist(this.ranklist);
    },
  },
});
</script>

<style lang="less" scoped>
.rankland-ranklist {
  width: 100%;
  overflow-x: auto;
}
</style>
```

- [ ] **Step 2: Verify the wrapper imports compile**

Run:

```bash
fnm exec --using v24.11.1 corepack pnpm run build:client
```

Expected: PASS. If this fails because the style package default export is not compatible with Vite SSR, change only the style import to:

```ts
import '@algoux/standard-ranklist-renderer-component-styles/style.css';
```

Then rerun the same command and require PASS.

- [ ] **Step 3: Commit Task 2**

Run:

```bash
git add src/client/components/rankland-ranklist.vue package.json pnpm-lock.yaml
git commit -m "feat: add Vue ranklist renderer wrapper"
```

Expected: local commit only. If `package.json` and `pnpm-lock.yaml` were not changed, omit them from `git add`.

---

## Task 3: Public `/ranklist/:id` SSR Route

**Files:**

- Create: `src/client/modules/ranklist/ranklist.view.vue`
- Modify: `src/client/router/routes.ts`
- Modify: `src/client/router/types.d.ts`
- Modify: `src/common/router/client-routes.ts`
- Modify: `tests/unit/client-routes.spec.ts`
- Modify: `tests/unit/e2e-client-routes.spec.ts`

- [ ] **Step 1: Add failing client route assertions**

Modify `tests/unit/client-routes.spec.ts` by adding this test inside the existing `describe('client routes', () => { ... })` block:

```ts
  it('includes the public SSR ranklist route', async () => {
    delete process.env.RANKLAND_E2E_PROBE;

    const routes = (await import('@client/routes')).default;
    const ranklistRoute = routes.find((route) => route.name === 'Ranklist');

    expect(ranklistRoute).toMatchObject({
      path: '/ranklist/:id',
    });
  });
```

- [ ] **Step 2: Add failing server route map assertions**

Modify `tests/unit/e2e-client-routes.spec.ts` by adding this test inside the existing `describe('getClientRoutesMapForServer', () => { ... })` block:

```ts
  it('includes the public ranklist route as an SSR route', () => {
    delete process.env.RANKLAND_E2E_PROBE;

    const routes = getClientRoutesMapForServer();

    expect(routes.get('Ranklist')).toEqual({
      path: '/ranklist/:id',
      routeProps: undefined,
      renderMethod: RenderMethodKind.SSR,
    });
  });
```

- [ ] **Step 3: Run route tests and verify they fail**

Run:

```bash
fnm exec --using v24.11.1 corepack pnpm test:unit -- tests/unit/client-routes.spec.ts tests/unit/e2e-client-routes.spec.ts
```

Expected: FAIL because `Ranklist` is not registered yet.

- [ ] **Step 4: Create the ranklist route module**

Create `src/client/modules/ranklist/ranklist.view.vue`:

```vue
<template>
  <main class="ranklist-page" data-id="ranklist-page">
    <Head>
      <title>{{ pageTitle }}</title>
      <meta property="og:title" :content="pageTitle" />
      <meta property="og:url" :content="canonicalUrl" />
      <link rel="canonical" :href="canonicalUrl" />
    </Head>

    <section v-if="isNotFound" class="ranklist-page__message" data-id="ranklist-not-found">
      <h2>Ranklist Not Found</h2>
      <router-link to="/" data-id="ranklist-not-found-home-link">Back to Home</router-link>
    </section>

    <section v-else-if="isGenericError" class="ranklist-page__message" data-id="ranklist-error">
      <p>An error occurred while loading data</p>
      <button type="button" @click="reloadPage">Refresh</button>
    </section>

    <section v-else-if="!ranklist" class="ranklist-page__message" data-id="ranklist-loading">
      Loading...
    </section>

    <section
      v-else
      class="ranklist-page__content"
      data-id="ranklist-content"
      :data-ranklist-id="ranklistId"
      :data-row-count="rowCount"
    >
      <h1>{{ ranklist.info.name }}</h1>
      <div data-id="ranklist-hydrated">{{ hydrated ? 'hydrated' : 'ssr' }}</div>
      <RanklandRanklist :ranklist="ranklist.srk" />
    </section>
  </main>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { routeView, RenderMethodKind } from 'bwcx-client-vue3';
import type { IApiRanklist } from '@common/rankland-api';
import type { AsyncDataOptions } from '@client/typings';
import { formatTitle } from '@client/utils/title-format.util';
import RanklandRanklist from '@client/components/rankland-ranklist.vue';
import { classifyRanklistLoadError, type RanklistLoadErrorState } from './ranklist-error';

const RanklistPage = defineComponent({
  name: 'Ranklist',
  components: {
    RanklandRanklist,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
    ranklist: {
      type: Object as PropType<IApiRanklist>,
      required: false,
    },
    loadError: {
      type: Object as PropType<RanklistLoadErrorState>,
      required: false,
    },
  },
  data() {
    return {
      hydrated: false,
    };
  },
  computed: {
    isNotFound(): boolean {
      return this.loadError?.kind === 'not-found';
    },
    isGenericError(): boolean {
      return this.loadError?.kind === 'generic';
    },
    pageTitle(): string {
      if (this.isNotFound) {
        return formatTitle('Not Found');
      }
      return formatTitle(this.ranklist?.info.name);
    },
    canonicalUrl(): string {
      return `/ranklist/${encodeURIComponent(this.ranklistId)}`;
    },
    ranklistId(): string {
      return this.ranklist?.info.uniqueKey || this.id;
    },
    rowCount(): string {
      return String(this.ranklist?.srk?.rows?.length || 0);
    },
  },
  mounted() {
    this.hydrated = true;
  },
  methods: {
    reloadPage() {
      window.location.reload();
    },
  },
  async asyncData({ ranklandApiService, to }: AsyncDataOptions) {
    try {
      const ranklist = await ranklandApiService.getRanklist({ uniqueKey: String(to.params.id) });
      return {
        ranklist,
        loadError: undefined,
      };
    } catch (error) {
      return {
        ranklist: undefined,
        loadError: classifyRanklistLoadError(error),
      };
    }
  },
});

export default routeView(RanklistPage, '/ranklist/:id', undefined, undefined, {
  renderMethod: RenderMethodKind.SSR,
});
</script>

<style lang="less" scoped>
.ranklist-page {
  width: min(1180px, calc(100vw - 32px));
  margin: 32px auto;
}

.ranklist-page__content h1 {
  margin: 0 0 24px;
  font-size: 28px;
  line-height: 1.25;
}

.ranklist-page__message {
  margin-top: 64px;
  text-align: center;
}
</style>
```

- [ ] **Step 5: Generate route files**

Run:

```bash
fnm exec --using v24.11.1 corepack pnpm run gen:client-router
```

Expected: generated route output includes `Ranklist`. Stop the watcher with `Ctrl+C` after generation completes.

If the generator cannot be stopped cleanly through the shell session, manually update only these generated files to match the generated format already present:

`src/client/router/routes.ts` must include:

```ts
  {
    name: 'Ranklist',
    path: '/ranklist/:id',
    fullPath: '/ranklist/:id',
    component: () => import(/* webpackChunkName: "Ranklist" */ '../modules/ranklist/ranklist.view.vue'),
    routeProps: undefined,
    priority: undefined,
    renderMethod: RenderMethodKind.SSR,
    otherOptions: undefined,
  },
```

`src/common/router/client-routes.ts` must include:

```ts
  ['Ranklist', { path: '/ranklist/:id', routeProps: undefined, renderMethod: RenderMethodKind.SSR }],
```

`src/client/router/types.d.ts` must include the `Ranklist` route name and params in the same style as the generated file uses for existing routes.

- [ ] **Step 6: Run route tests and verify they pass**

Run:

```bash
fnm exec --using v24.11.1 corepack pnpm test:unit -- tests/unit/client-routes.spec.ts tests/unit/e2e-client-routes.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Verify the route compiles in the client build**

Run:

```bash
fnm exec --using v24.11.1 corepack pnpm run build:client
```

Expected: PASS.

- [ ] **Step 8: Commit Task 3**

Run:

```bash
git add src/client/modules/ranklist/ranklist.view.vue src/client/router/routes.ts src/client/router/types.d.ts src/common/router/client-routes.ts tests/unit/client-routes.spec.ts tests/unit/e2e-client-routes.spec.ts
git commit -m "feat: add ranklist detail SSR route"
```

Expected: local commit only, no push.

---

## Task 4: Full-Chain Ranklist E2E Coverage

**Files:**

- Modify: `tests/e2e/support/start-full-chain-e2e.js`
- Create: `tests/e2e/full-chain/ranklist.spec.ts`

- [ ] **Step 1: Add a controlled missing-rank branch to the mock backend**

Modify `tests/e2e/support/start-full-chain-e2e.js`.

Find:

```js
  if (method === 'GET' && /^\/rank\/[^/]+$/.test(url.pathname)) {
    sendJson(res, 200, ok(ranklistInfo));
    return;
  }
```

Replace it with:

```js
  if (method === 'GET' && /^\/rank\/[^/]+$/.test(url.pathname)) {
    if (url.pathname === '/rank/missing-key') {
      sendJson(res, 200, { code: 11, message: 'Ranklist not found' });
      return;
    }

    sendJson(res, 200, ok(ranklistInfo));
    return;
  }
```

- [ ] **Step 2: Write the full-chain ranklist tests**

Create `tests/e2e/full-chain/ranklist.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { denyExternalCalls } from '../helpers/mock-api';

const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;

test.describe('/ranklist/:id full-chain route', () => {
  test('renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend', async ({
    page,
    request,
  }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/ranklist/test-key');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    expect(await response!.text()).toContain('Test Contest 2024');
    await expect(page).toHaveTitle('Test Contest 2024 - RankLand');
    await expect(
      page.locator('[data-id="ranklist-content"][data-ranklist-id="test-key"][data-row-count="2"]'),
    ).toBeVisible();
    await expect(page.getByText('Team Alpha')).toBeVisible();
    await expect(page.getByText('Team Beta')).toBeVisible();
    await expect(page.locator('[data-id="ranklist-hydrated"]')).toHaveText('hydrated');

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string; search: string }>;

    expect(requests.some((requestRecord) => requestRecord.path === '/rank/test-key')).toBe(true);
    expect(
      requests.some(
        (requestRecord) =>
          requestRecord.path === '/file/download' && new URLSearchParams(requestRecord.search).get('id') === 'file-test-1',
      ),
    ).toBe(true);
  });

  test('renders the NotFound page through the full chain when the backend returns code 11', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/ranklist/missing-key');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle('Not Found - RankLand');
    await expect(page.locator('[data-id="ranklist-not-found"]')).toBeVisible();
    await expect(page.locator('[data-id="ranklist-not-found-home-link"][href="/"]')).toBeVisible();

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string }>;

    expect(requests.some((requestRecord) => requestRecord.path === '/rank/missing-key')).toBe(true);
  });
});
```

- [ ] **Step 3: Run the new full-chain tests**

Run:

```bash
fnm exec --using v24.11.1 corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/ranklist.spec.ts
```

Expected: PASS with the two ranklist full-chain tests.

If this fails because the Vue renderer is not SSR-compatible, make the smallest route/component adjustment that preserves SSR route data loading and stable SSR content:

- keep `RanklandApiService.getRanklist` in `asyncData`;
- keep title, row count, selectors, `Team Alpha`, and `Team Beta` visible in SSR HTML;
- mount the package renderer client-side only behind `client-only`;
- document this fallback in the task commit message body.

Then rerun the same command and require PASS.

- [ ] **Step 4: Verify the existing full-chain probe still passes**

Run:

```bash
fnm exec --using v24.11.1 corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/rankland-probe.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 4**

Run:

```bash
git add tests/e2e/support/start-full-chain-e2e.js tests/e2e/full-chain/ranklist.spec.ts
git commit -m "test: add full-chain ranklist page coverage"
```

Expected: local commit only, no push.

---

## Task 5: Final Migration Verification

**Files:**

- Modify only if verification exposes a real defect in the files changed by Tasks 1-4.

- [ ] **Step 1: Run the full migration gate under Node 24**

Run:

```bash
fnm exec --using v24.11.1 corepack pnpm test:migration
```

Expected: PASS. This includes build, unit, SSR smoke, shallow E2E, and full-chain E2E.

- [ ] **Step 2: Verify no full-chain process leaks remain**

Run:

```bash
ps -axo pid,command | rg "start-full-chain-e2e|tsnd --respawn|SERVER_PORT=3100|src/server/index.ts|FULL_CHAIN_MOCK_PORT" || true
```

Expected: no running full-chain app server, mock backend, or launcher process remains.

Run:

```bash
lsof -nP -iTCP:3100 -iTCP:3101 -sTCP:LISTEN || true
```

Expected: no listeners remain on full-chain app or mock ports.

- [ ] **Step 3: Inspect branch state**

Run:

```bash
git status --short --branch
git log --oneline --decorate -6
```

Expected:

- branch is `migration/ranklist-page-foundation`;
- no uncommitted implementation changes remain unless verification forced a fix that still needs review;
- recent local commits show the spec commit and task commits;
- nothing has been pushed or merged.

- [ ] **Step 4: Record final verification evidence in the controller final response**

The final response must include:

- the branch name;
- the commits created;
- the exact final verification command;
- whether it passed or failed;
- if it failed, the exact failing command and next required fix.

Do not claim completion without fresh output from Step 1 and Step 2.

---

## Plan Self-Review

- Spec coverage: route, SSR data loading, `RanklandApiService`, minimal Vue renderer, title/head metadata, NotFound, full-chain backend request assertions, no `page.route` app API mocking, hidden probe preservation, and Node 24 migration gate are covered.
- Placeholder scan: no deferred implementation placeholders are present.
- Type consistency: `formatTitle`, `classifyRanklistLoadError`, `RanklistLoadErrorState`, `RanklandRanklist`, route name `Ranklist`, and `/ranklist/:id` are used consistently across tasks.
