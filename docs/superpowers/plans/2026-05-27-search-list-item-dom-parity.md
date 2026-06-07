# Search List Item DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `/search` list row container contract by removing the Vue-only `.search-list-item` class and display override from result and recent rows.

**Architecture:** This is a narrow CSR route DOM parity slice. Full-chain Playwright tests verify the public Ant Design list item DOM emitted by `src/client/modules/search/search.view.vue`, and implementation removes only the page-local row class and unused scoped style.

**Tech Stack:** Vue 3 SFC, Ant Design Vue, Playwright full-chain E2E, pnpm migration gates.

---

## File Structure

- Modify `tests/e2e/full-chain/search.spec.ts`: assert search list item rows have no Vue-only `.search-list-item` class and keep Ant Design default `display: flex`.
- Modify `src/client/modules/search/search.view.vue`: remove `class="search-list-item"` from both `a-list-item` nodes and delete the scoped `.search-list-item` display override.
- Modify `docs/migration/status.md`: record the verified search list item DOM parity slice.
- Modify `docs/migration/manual-acceptance-checklist.md`: add the list item no-custom-class checkpoint.
- Modify `docs/migration/final-integration-review.md`: record the new search list item evidence.

### Task 1: RED Search List Item Assertions

**Files:**
- Modify: `tests/e2e/full-chain/search.spec.ts`

- [ ] **Step 1: Write the failing recent-list assertions**

In the `shows recent ranklists for an empty query through CSR and listAllRanklists` test, after the existing `ant-list-item` count assertion, add:

```ts
const recentListItem = page.locator('[data-id="search-ranklist-item"].ant-list-item').first();
await expect(recentListItem).not.toHaveClass(/search-list-item/);
await expect(recentListItem).toHaveCSS('display', 'flex');
await expect(page.locator('.search-list-item')).toHaveCount(0);
```

- [ ] **Step 2: Write the failing utility-class assertions**

In the `renders legacy search list utility class tokens` test, after creating `resultRow`, add:

```ts
await expect(resultRow).not.toHaveClass(/search-list-item/);
await expect(resultRow).toHaveCSS('display', 'flex');
```

After creating `recentRow`, add:

```ts
await expect(recentRow).not.toHaveClass(/search-list-item/);
await expect(recentRow).toHaveCSS('display', 'flex');
await expect(page.locator('.search-list-item')).toHaveCount(0);
```

- [ ] **Step 3: Run RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "shows recent ranklists|renders legacy search list utility class tokens"
```

Expected: FAIL because current list items still emit `.search-list-item` and compute `display: block`.

### Task 2: GREEN Search List Item Template

**Files:**
- Modify: `src/client/modules/search/search.view.vue`

- [ ] **Step 1: Implement the minimal template change**

Change both result and recent list item nodes from:

```vue
<a-list-item
  data-id="search-ranklist-item"
  class="search-list-item"
  :data-ranklist-key="item.uniqueKey"
>
```

to:

```vue
<a-list-item
  data-id="search-ranklist-item"
  :data-ranklist-key="item.uniqueKey"
>
```

- [ ] **Step 2: Remove the unused scoped style**

Delete:

```less
.search-list-item {
  display: block;
}
```

- [ ] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "shows recent ranklists|renders legacy search list utility class tokens"
```

Expected: PASS for the focused recent-list and list-utility tests.

### Task 3: Docs, Full Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Update migration docs**

Record the slice as Search list item DOM parity and include RED/GREEN evidence plus the full migration gate result.

- [ ] **Step 2: Run the full completed-slice gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, route generation succeeds, migration tests pass, and `git diff --check` has no output.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/client/modules/search/search.view.vue tests/e2e/full-chain/search.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-search-list-item-dom-parity-design.md docs/superpowers/plans/2026-05-27-search-list-item-dom-parity.md
git commit -m "fix: 还原搜索页列表项 DOM"
```

- [ ] **Step 4: Run post-commit checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean `migration/live-page-foundation` branch, latest commit is `fix: 还原搜索页列表项 DOM`, and no whitespace errors.
