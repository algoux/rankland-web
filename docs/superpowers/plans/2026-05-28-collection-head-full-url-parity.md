# Collection Head Full URL Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `/collection/:id` loaded-state Head output with absolute `og:url` and canonical URL.

**Architecture:** Keep Head ownership inside `src/client/modules/collection/collection.view.vue`. Reuse the existing production-site URL helper from Home, matching the recent Ranklist Head full URL slice without introducing a broader utility move.

**Tech Stack:** Vue 3 SFC template, bwcx/vite-ssr, Playwright full-chain E2E, Node 24, pnpm 8.

---

### Task 1: RED - capture Collection loaded Head URLs

**Files:**
- Modify: `tests/e2e/full-chain/collection.spec.ts`

- [x] **Step 1: Add loaded-state Head assertions**

Add these assertions after the existing title assertion in `renders selected ranklist through SSR, hydration, RanklandApiService, and the mock backend`:

```ts
const expectedCollectionCanonicalUrl = 'https://rl.algoux.org/collection/official?rankId=test-key';
await expect(page.locator('head meta[property="og:title"]')).toHaveAttribute(
  'content',
  'Test Contest 2024 - 榜单合集 | RankLand',
);
await expect(page.locator('head meta[property="og:url"]')).toHaveAttribute(
  'content',
  expectedCollectionCanonicalUrl,
);
await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', expectedCollectionCanonicalUrl);
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders selected ranklist"
```

Expected: FAIL because current Vue renders route-relative `og:url` and canonical URLs.

Observed: FAIL. The focused test expected `head meta[property="og:url"]` content `https://rl.algoux.org/collection/official?rankId=test-key` and received `/collection/official?rankId=test-key`, reproducing the route-relative URL gap.

### Task 2: GREEN - restore old React absolute Collection Head URLs

**Files:**
- Modify: `src/client/modules/collection/collection.view.vue`

- [x] **Step 1: Reuse existing absolute URL helper**

Add the import:

```ts
import { buildHomeAbsoluteUrl } from '@client/modules/home/home-site';
```

Change:

```ts
canonicalUrl(): string {
  return ranklandRoutes.collection.build({
    id: this.id,
    rankId: this.rankId && !this.ranklistIdInvalid ? this.rankId : undefined,
  });
},
```

to:

```ts
canonicalUrl(): string {
  return buildHomeAbsoluteUrl(
    ranklandRoutes.collection.build({
      id: this.id,
      rankId: this.rankId && !this.ranklistIdInvalid ? this.rankId : undefined,
    }),
  );
},
```

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders selected ranklist"
```

Expected: PASS with new Head URL assertions and existing Collection behavior checks.

Observed: PASS. The focused full-chain case verifies the loaded Collection Head title, `og:title`, absolute `og:url`, and absolute canonical URL while preserving existing Collection SSR/hydration/menu/selected-ranklist behavior checks.

### Task 3: Migration docs, full gate, commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Update migration docs**

Record this slice as `Collection Head full URL parity`, including:

- old React loaded-state `Helmet` evidence with absolute `og:url` and canonical;
- Vue restoration using absolute production URL;
- focused RED/GREEN evidence;
- full gate evidence.

Observed: migration status, manual acceptance checklist, and final integration review now record the Collection Head full URL RED/GREEN and full gate evidence.

- [x] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS with Node 24, pnpm 8, generated client routes, migration tests, and whitespace check.

Observed: PASS. Node `v24.11.1`, pnpm `8.15.9`; `gen:client-router` generated 6 client routes; `test:migration` passed with build, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 60 passed / 1 skipped full-chain Playwright tests; `git diff --check` passed.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/modules/collection/collection.view.vue tests/e2e/full-chain/collection.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-collection-head-full-url-parity-design.md docs/superpowers/plans/2026-05-28-collection-head-full-url-parity.md
git commit -m "fix: 还原 Collection Head URL"
```

Observed: committed and amended into the current `fix: 还原 Collection Head URL` slice commit.

- [x] **Step 4: Run post-checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean branch status and no whitespace errors.

Observed: initial post-check found only this plan evidence file modified for amendment; `git show --check --oneline HEAD` and `git diff --check` passed. Process check found no lingering Playwright/Vite/mock full-chain server, only editor TypeScript server and the check commands themselves.
