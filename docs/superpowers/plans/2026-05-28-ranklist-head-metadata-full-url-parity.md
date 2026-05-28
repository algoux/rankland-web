# Ranklist Head Metadata Full URL Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `/ranklist/:id` loaded-state Head output with `og:title`, absolute `og:url`, and absolute canonical URL.

**Architecture:** Keep Head ownership inside `src/client/modules/ranklist/ranklist.view.vue`. Reuse the existing production-site URL helper from Home instead of introducing a new global abstraction in this narrow slice.

**Tech Stack:** Vue 3 SFC template, bwcx/vite-ssr, Playwright full-chain E2E, Node 24, pnpm 8.

---

### Task 1: RED - capture Ranklist loaded Head metadata

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add loaded-state Head assertions**

Add these assertions after the existing title assertion in `renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend`:

```ts
const expectedRanklistCanonicalUrl = 'https://rl.algoux.org/ranklist/test-key';
await expect(page.locator('head meta[property="og:title"]')).toHaveAttribute(
  'content',
  'Test Contest 2024 | RankLand',
);
await expect(page.locator('head meta[property="og:url"]')).toHaveAttribute('content', expectedRanklistCanonicalUrl);
await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', expectedRanklistCanonicalUrl);
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
```

Expected: FAIL because current Vue omits loaded-state `og:title` / `og:url` and uses a relative canonical URL.

Observed: FAIL. The focused test timed out waiting for `head meta[property="og:title"]` content `Test Contest 2024 | RankLand` and received an empty string, reproducing the missing loaded-state Head metadata.

### Task 2: GREEN - restore old React Ranklist Head metadata

**Files:**
- Modify: `src/client/modules/ranklist/ranklist.view.vue`

- [x] **Step 1: Add Head meta tags**

Change:

```vue
<Head>
  <title>{{ pageTitle }}</title>
  <link rel="canonical" :href="canonicalUrl">
</Head>
```

to:

```vue
<Head>
  <title>{{ pageTitle }}</title>
  <meta v-if="ranklist" property="og:title" :content="pageTitle">
  <meta v-if="ranklist" property="og:url" :content="canonicalUrl">
  <link rel="canonical" :href="canonicalUrl">
</Head>
```

- [x] **Step 2: Reuse existing absolute URL helper**

Add imports:

```ts
import { ranklandRoutes } from '@common/rankland-router';
import { buildHomeAbsoluteUrl } from '@client/modules/home/home-site';
```

Change:

```ts
canonicalUrl(): string {
  return `/ranklist/${encodeURIComponent(this.ranklistId)}`;
},
```

to:

```ts
canonicalUrl(): string {
  return buildHomeAbsoluteUrl(ranklandRoutes.ranklist.build({ id: this.ranklistId }));
},
```

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
```

Expected: PASS with new Head assertions and existing Ranklist behavior checks.

Observed: PASS. The focused Ranklist full-chain test passed with loaded-state `og:title`, absolute `og:url`, absolute canonical, and existing SSR/hydration/SRK behavior checks.

### Task 3: Migration docs, full gate, commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Update migration docs**

Record this slice as `Ranklist Head metadata full URL parity`, including:

- old React loaded-state `Helmet` evidence with `og:title`, `og:url`, and canonical;
- Vue restoration using absolute production URL;
- focused RED/GREEN evidence;
- full gate evidence.

- [x] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS with Node 24, pnpm 8, generated client routes, migration tests, and whitespace check.

Observed: PASS with Node `v24.11.1` and pnpm `8.15.9`; `gen:client-router` generated 6 client routes; `test:migration` passed with build, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 60 passed / 1 skipped full-chain Playwright tests; `git diff --check` passed.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/modules/ranklist/ranklist.view.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-ranklist-head-metadata-full-url-parity-design.md docs/superpowers/plans/2026-05-28-ranklist-head-metadata-full-url-parity.md
git commit -m "fix: 还原 Ranklist Head 元数据 URL"
```

Observed: committed this slice with subject `fix: 还原 Ranklist Head 元数据 URL`.

- [x] **Step 4: Run post-checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean branch status and no whitespace errors.

Observed before final amend: branch status was clean, `git show --check --oneline HEAD` reported the slice commit without whitespace errors, `git diff --check` produced no output, and process inspection showed no lingering Playwright/Vite/mock server process.
