# Search Input DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `/search` input class contract by removing the Vue-only `.search-input` class while preserving Ant Design search control behavior.

**Architecture:** This is a narrow CSR route DOM parity slice. Full-chain Playwright tests verify the public Ant Design search wrapper emitted by `src/client/modules/search/search.view.vue`, and the implementation removes only the page-local class and its unused scoped style.

**Tech Stack:** Vue 3 SFC, Ant Design Vue, Playwright full-chain E2E, pnpm migration gates.

---

## File Structure

- Modify `tests/e2e/full-chain/search.spec.ts`: assert the search wrapper has no Vue-only `.search-input` class, no `.search-input` exists, and wrapper top margin stays at 0px.
- Modify `src/client/modules/search/search.view.vue`: remove `class="search-input"` from `a-input-search` and delete the scoped `.search-input` style rule.
- Modify `docs/migration/status.md`: record the verified search input DOM parity slice.
- Modify `docs/migration/manual-acceptance-checklist.md`: add the search input no-custom-class checkpoint.
- Modify `docs/migration/final-integration-review.md`: record the new search input evidence.

### Task 1: RED Search Input Assertions

**Files:**
- Modify: `tests/e2e/full-chain/search.spec.ts`

- [ ] **Step 1: Write the failing test assertions**

In the `shows recent ranklists for an empty query through CSR and listAllRanklists` test, replace the loose search input wrapper visibility assertion with:

```ts
const searchInputWrapper = page.locator('.ant-input-search:has([data-id="search-input"])');
await expect(searchInputWrapper).toBeVisible();
await expect(searchInputWrapper).not.toHaveClass(/search-input/);
await expect(searchInputWrapper).toHaveCSS('margin-top', '0px');
await expect(page.locator('.search-input')).toHaveCount(0);
await expect(page.locator('[data-id="search-input"].ant-input')).toBeVisible();
```

- [ ] **Step 2: Run RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "shows recent ranklists"
```

Expected: FAIL because the current search control still emits `.search-input`.

### Task 2: GREEN Search Input Template

**Files:**
- Modify: `src/client/modules/search/search.view.vue`

- [ ] **Step 1: Implement the minimal template change**

Change:

```vue
<a-input-search
  v-model:value="inputKeyword"
  data-id="search-input"
  class="search-input"
  placeholder="输入关键词搜索"
  allow-clear
  enter-button
  @search="submitSearch"
/>
```

to:

```vue
<a-input-search
  v-model:value="inputKeyword"
  data-id="search-input"
  placeholder="输入关键词搜索"
  allow-clear
  enter-button
  @search="submitSearch"
/>
```

- [ ] **Step 2: Remove the unused scoped style**

Delete:

```less
.search-input {
  margin-top: 0;
}
```

- [ ] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "shows recent ranklists"
```

Expected: PASS for the focused input/recent-list test.

### Task 3: Docs, Full Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Update migration docs**

Record the slice as Search input DOM parity and include RED/GREEN evidence plus the full migration gate result.

- [ ] **Step 2: Run the full completed-slice gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, route generation succeeds, migration tests pass, and `git diff --check` has no output.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/client/modules/search/search.view.vue tests/e2e/full-chain/search.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-search-input-dom-parity-design.md docs/superpowers/plans/2026-05-27-search-input-dom-parity.md
git commit -m "fix: 还原搜索页输入框 DOM"
```

- [ ] **Step 4: Run post-commit checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean `migration/live-page-foundation` branch, latest commit is `fix: 还原搜索页输入框 DOM`, and no whitespace errors.
