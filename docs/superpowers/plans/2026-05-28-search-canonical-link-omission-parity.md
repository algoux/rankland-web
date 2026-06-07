# Search Canonical Link Omission Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `/search` Head output by removing the Vue-only route-level canonical link.

**Architecture:** Keep Search Head ownership in `search.view.vue`. The route still declares title and `og:title`, while app-level document defaults remain outside this slice.

**Tech Stack:** Vue 3 SFC template, Playwright full-chain E2E, Node 24, pnpm 8.

---

### Task 1: RED - capture canonical omission

**Files:**
- Modify: `tests/e2e/full-chain/search.spec.ts`

- [x] **Step 1: Assert no Search canonical link**

Add this assertion after the title check in `shows recent ranklists for an empty query through CSR and listAllRanklists`:

```ts
await expect(page.locator('head link[rel="canonical"]')).toHaveCount(0);
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "shows recent ranklists"
```

Observed RED: FAIL because current Vue rendered one `head link[rel="canonical"]` element instead of the old React count `0`.

### Task 2: GREEN - remove Vue-only canonical output

**Files:**
- Modify: `src/client/modules/search/search.view.vue`

- [x] **Step 1: Remove the canonical link**

Change:

```vue
<Head>
  <title>{{ pageTitle }}</title>
  <meta property="og:title" :content="pageTitle">
  <link rel="canonical" :href="canonicalPath">
</Head>
```

to:

```vue
<Head>
  <title>{{ pageTitle }}</title>
  <meta property="og:title" :content="pageTitle">
</Head>
```

- [x] **Step 2: Remove the unused computed property**

Remove:

```ts
canonicalPath(): string {
  return ranklandRoutes.search.build({ kw: this.keyword || undefined });
},
```

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "shows recent ranklists"
```

Observed GREEN: PASS with `1 passed`.

### Task 3: Migration docs, full gate, commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Update migration docs**

Record this slice as `Search canonical link omission parity`, including:

- old React `Helmet` evidence with no canonical link;
- Vue route-local canonical removal;
- focused RED/GREEN evidence;
- full gate evidence.

- [x] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Observed: PASS. Node `v24.11.1`, pnpm `8.15.9`, generated 6 client routes, build passed, 36 unit files / 154 unit tests passed, 1 SSR smoke test passed, 1 shallow Playwright test passed, 60 full-chain tests passed with 1 conditional skip, and `git diff --check` produced no output.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/modules/search/search.view.vue tests/e2e/full-chain/search.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-search-canonical-link-omission-parity-design.md docs/superpowers/plans/2026-05-28-search-canonical-link-omission-parity.md
git commit -m "fix: 移除 Search canonical 链接"
```

Observed: committed as `fix: 移除 Search canonical 链接`.

- [x] **Step 4: Run post-checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean branch status and no whitespace errors.

Observed: clean branch status on `migration/live-page-foundation`, `git show --check --oneline HEAD` reported `fix: 移除 Search canonical 链接`, `git diff --check` produced no output, and the process scan showed no lingering Playwright/Vite/mock server process.
