# Search Empty State Dark Text Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old Ant Design/global body text color parity for the `/search` recent empty state in dark mode.

**Architecture:** Keep the change local to the search route. A deterministic full-chain E2E test forces dark mode and an empty `listAllRanklists` response, then the scoped Vue CSS uses the existing global legacy text token.

**Tech Stack:** Vue 3 SFC scoped LESS, Ant Design Vue, Playwright full-chain E2E, bwcx/Vite SSR migration harness.

---

### Task 1: RED Test For Search Empty State Dark Text

**Files:**
- Modify: `tests/e2e/full-chain/search.spec.ts`

- [x] **Step 1: Add dark-mode helper**

Add near the existing helpers:

```ts
async function forceSystemDarkMode(page: Page) {
  await page.addInitScript(() => {
    window.matchMedia = ((query: string) => ({
      media: query,
      matches: query === '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    })) as typeof window.matchMedia;
  });
}
```

- [x] **Step 2: Add failing assertion**

In `renders the recent empty state with the legacy mt-2 spacing`, call `await forceSystemDarkMode(page);` before `page.goto('/search')`, then add:

```ts
    await expect(page.locator('[data-id="search-recent-section"] .search-empty-state')).toHaveCSS(
      'color',
      'rgba(255, 255, 255, 0.85)',
    );
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts --grep "renders the recent empty state"
```

Expected: FAIL because `.search-empty-state` currently computes to `rgb(100, 116, 139)`.

### Task 2: Minimal Search CSS Fix

**Files:**
- Modify: `src/client/modules/search/search.view.vue`

- [x] **Step 1: Replace hard-coded empty-state color**

Change:

```less
.search-empty-state {
  margin-top: 8px;
  color: #64748b;
}
```

To:

```less
.search-empty-state {
  margin-top: 8px;
  color: var(--rankland-legacy-text-color);
}
```

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts --grep "renders the recent empty state"
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
- Modify: `docs/superpowers/plans/2026-05-26-search-empty-state-dark-text-parity.md`

- [x] **Step 1: Update docs with pending verification**

Record the current slice as `search empty state dark text parity`, with full gate evidence pending.

- [x] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, router generation succeeds, migration test suite passes, and whitespace check exits 0.

- [x] **Step 3: Mark docs verified**

Update the status docs and this plan with the passing full-gate evidence.

- [x] **Step 4: Commit**

Run:

```bash
git add tests/e2e/full-chain/search.spec.ts src/client/modules/search/search.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-26-search-empty-state-dark-text-parity-design.md docs/superpowers/plans/2026-05-26-search-empty-state-dark-text-parity.md
git commit -m "fix: 还原搜索空状态深色文字"
```

Expected: commit created on `migration/live-page-foundation`.
