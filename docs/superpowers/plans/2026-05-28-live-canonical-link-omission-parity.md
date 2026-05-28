# Live Canonical Link Omission Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `/live/:id` Head output by removing the Vue-only route-level canonical link.

**Architecture:** Keep Live Head ownership in `live.view.vue`. The route still declares title and `og:title`, while app-level document defaults remain outside this slice.

**Tech Stack:** Vue 3 SFC template, Playwright full-chain E2E, Node 24, pnpm 8.

---

### Task 1: RED - capture canonical omission

**Files:**
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [x] **Step 1: Assert no Live canonical link**

Add this assertion after the loaded route title check in `hydrates the CSR live page, preserves queries, polls live ranklist, and guards WebSocket setup`:

```ts
await expect(page.locator('head link[rel="canonical"]')).toHaveCount(0);
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page"
```

Expected: FAIL because current Vue renders a route-local canonical link.

Observed: FAIL. The focused test expected zero `head link[rel="canonical"]` nodes and received one, reproducing the Vue-only route-local canonical link on `/live/:id`.

### Task 2: GREEN - remove Vue-only canonical output

**Files:**
- Modify: `src/client/modules/live/live.view.vue`

- [x] **Step 1: Remove the canonical link**

Change:

```vue
<Head>
  <title>{{ pageTitle }}</title>
  <meta property="og:title" :content="pageTitle">
  <link rel="canonical" :href="canonicalUrl">
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
canonicalUrl(): string {
  return `/live/${encodeURIComponent(this.id)}`;
},
```

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page"
```

Expected: PASS with the new Head assertion and existing Live behavior checks.

Observed: PASS. The focused Live full-chain test passed with the new canonical omission assertion and existing hydration/query/polling/WebSocket checks.

### Task 3: Migration docs, full gate, commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Update migration docs**

Record this slice as `Live canonical link omission parity`, including:

- old React `Helmet` evidence with no canonical link;
- Vue route-local canonical removal;
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
git add src/client/modules/live/live.view.vue tests/e2e/full-chain/live.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-live-canonical-link-omission-parity-design.md docs/superpowers/plans/2026-05-28-live-canonical-link-omission-parity.md
git commit -m "fix: 移除 Live canonical 链接"
```

Observed: committed this slice with subject `fix: 移除 Live canonical 链接`.

- [x] **Step 4: Run post-checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean branch status and no whitespace errors.

Observed before final amend: branch status was clean, `git show --check --oneline HEAD` reported the slice commit without whitespace errors, `git diff --check` produced no output, and process inspection showed no lingering Playwright/Vite/mock server process.
