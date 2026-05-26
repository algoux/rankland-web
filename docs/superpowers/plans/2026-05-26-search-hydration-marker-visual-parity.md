# Search Hydration Marker Visual Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the `/search` hydration marker from the visible product UI while preserving the full-chain hydration selector and text assertion.

**Architecture:** Keep the marker in the Vue template and make a scoped CSS-only change. Playwright verifies both the hydration text and visual-hidden style.

**Tech Stack:** Vue 3 SFC scoped LESS, Playwright full-chain E2E, bwcx/Vite SSR migration harness.

---

### Task 1: RED Test For Visual-Hidden Search Marker

**Files:**
- Modify: `tests/e2e/full-chain/search.spec.ts`

- [x] **Step 1: Add failing visual-hidden assertions**

In `shows recent ranklists for an empty query through CSR and listAllRanklists`, immediately after:

```ts
    await expect(page.locator('[data-id="search-hydrated"]')).toHaveText('hydrated');
```

add:

```ts
    await expect(page.locator('[data-id="search-hydrated"]')).toHaveCSS('width', '1px');
    await expect(page.locator('[data-id="search-hydrated"]')).toHaveCSS('height', '1px');
    await expect(page.locator('[data-id="search-hydrated"]')).toHaveCSS('overflow', 'hidden');
    await expect(page.locator('[data-id="search-hydrated"]')).toHaveCSS('color', 'rgba(0, 0, 0, 0)');
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts --grep "shows recent ranklists"
```

Expected: FAIL because the current marker has visible width and `rgb(100, 116, 139)` text color.

### Task 2: Minimal Search Marker CSS Fix

**Files:**
- Modify: `src/client/modules/search/search.view.vue`

- [x] **Step 1: Hide the marker visually**

Change:

```less
.search-hydrated {
  color: #64748b;
  font-size: 12px;
}
```

To:

```less
.search-hydrated {
  width: 1px;
  height: 1px;
  overflow: hidden;
  color: transparent;
}
```

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts --grep "shows recent ranklists"
```

Expected: PASS.

- [x] **Step 3: Run full search spec**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts
```

Expected: 7 tests pass.

### Task 3: Migration Docs And Full Gate

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-26-search-hydration-marker-visual-parity.md`

- [x] **Step 1: Update docs with pending verification**

Record the current slice as `search hydration marker visual parity`, with focused GREEN complete and full gate pending.

- [x] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, router generation succeeds, migration test suite passes, and whitespace check exits 0.

- [x] **Step 3: Mark docs verified**

Update status docs and this plan with the passing full-gate evidence.

- [x] **Step 4: Commit**

Run:

```bash
git add tests/e2e/full-chain/search.spec.ts src/client/modules/search/search.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-26-search-hydration-marker-visual-parity-design.md docs/superpowers/plans/2026-05-26-search-hydration-marker-visual-parity.md
git commit -m "fix: 隐藏搜索页水合标记"
```

Expected: commit created on `migration/live-page-foundation`.
