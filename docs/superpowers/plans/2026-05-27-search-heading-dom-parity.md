# Search Heading DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `/search` heading class contract by removing the Vue-only `.search-heading` class while preserving the heading spacing.

**Architecture:** This is a narrow CSR route DOM parity slice. Full-chain Playwright tests verify the public heading DOM emitted by `src/client/modules/search/search.view.vue`, and implementation moves the heading top-margin reset to the scoped legacy utility class.

**Tech Stack:** Vue 3 SFC, Playwright full-chain E2E, pnpm migration gates.

---

## File Structure

- Modify `tests/e2e/full-chain/search.spec.ts`: assert the search heading has exact old `mb-6` class, no `.search-heading`, and preserved spacing.
- Modify `src/client/modules/search/search.view.vue`: remove `.search-heading` from the template and fold its `margin-top: 0` rule into `.mb-6`.
- Modify `docs/migration/status.md`: record the verified search heading DOM parity slice.
- Modify `docs/migration/manual-acceptance-checklist.md`: add the search heading exact class checkpoint.
- Modify `docs/migration/final-integration-review.md`: record the new search heading evidence.

### Task 1: RED Search Heading Assertions

**Files:**
- Modify: `tests/e2e/full-chain/search.spec.ts`

- [ ] **Step 1: Write the failing test assertions**

In the `shows recent ranklists for an empty query through CSR and listAllRanklists` test, replace the loose heading visibility assertion with:

```ts
const searchHeading = page.locator('h3.mb-6', { hasText: '在榜单数据库中探索' });
await expect(searchHeading).toBeVisible();
await expect(searchHeading).toHaveClass(/^mb-6$/);
await expect(searchHeading).toHaveCSS('margin-top', '0px');
await expect(searchHeading).toHaveCSS('margin-bottom', '24px');
await expect(page.locator('h3.search-heading')).toHaveCount(0);
```

- [ ] **Step 2: Run RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "shows recent ranklists"
```

Expected: FAIL because the current heading still has `class="search-heading mb-6"`.

### Task 2: GREEN Search Heading Template

**Files:**
- Modify: `src/client/modules/search/search.view.vue`

- [ ] **Step 1: Implement the minimal template change**

Change:

```vue
<h3 class="search-heading mb-6">在榜单数据库中探索</h3>
```

to:

```vue
<h3 class="mb-6">在榜单数据库中探索</h3>
```

- [ ] **Step 2: Move heading spacing to the old utility class**

Replace:

```less
.search-heading {
  margin-top: 0;
}

.mb-6 {
  margin-bottom: 24px;
}
```

with:

```less
.mb-6 {
  margin-top: 0;
  margin-bottom: 24px;
}
```

- [ ] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "shows recent ranklists"
```

Expected: PASS for the focused heading/recent-list test.

### Task 3: Docs, Full Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Update migration docs**

Record the slice as Search heading DOM parity and include RED/GREEN evidence plus the full migration gate result.

- [ ] **Step 2: Run the full completed-slice gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, route generation succeeds, migration tests pass, and `git diff --check` has no output.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/client/modules/search/search.view.vue tests/e2e/full-chain/search.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-search-heading-dom-parity-design.md docs/superpowers/plans/2026-05-27-search-heading-dom-parity.md
git commit -m "fix: 还原搜索页标题 DOM"
```

- [ ] **Step 4: Run post-commit checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean `migration/live-page-foundation` branch, latest commit is `fix: 还原搜索页标题 DOM`, and no whitespace errors.
