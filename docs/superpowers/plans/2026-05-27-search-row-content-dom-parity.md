# Search Row Content DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `/search` row content DOM class tokens on the title, view-count, and created-at nodes while preserving current visual spacing and full-chain coverage.

**Architecture:** This is a narrow CSR route parity slice. Tests assert the public DOM emitted by `src/client/modules/search/search.view.vue`, and implementation moves row presentation from Vue-only classes onto scoped legacy utility tokens.

**Tech Stack:** Vue 3 SFC, Ant Design Vue `a-list`, Playwright full-chain E2E, pnpm migration gates.

---

## File Structure

- Modify `tests/e2e/full-chain/search.spec.ts`: replace row-content assertions that rely on `.search-row-title`, `.search-view-count`, and `.search-created-at` with direct old-class selectors and absence assertions for the Vue-only classes.
- Modify `src/client/modules/search/search.view.vue`: remove Vue-only row content classes from result and recent row templates; add scoped utility styles for `.mb-0`, `.ml-2`, `.opacity-70`, `.opacity-50`, and `.text-sm`.
- Modify `docs/migration/status.md`: record the verified row content DOM parity slice.
- Modify `docs/migration/manual-acceptance-checklist.md`: add the row content DOM/class checkpoint.
- Modify `docs/migration/final-integration-review.md`: add the completed search row content note.

### Task 1: RED Search Row Content Assertions

- [ ] **Step 1: Write the failing full-chain assertions**

In `tests/e2e/full-chain/search.spec.ts`, update the `/search?kw=Test%202024` assertions to use:

```ts
const resultRow = page.locator('[data-id="search-ranklist-item"][data-ranklist-key="test-key"]');
const resultTitle = resultRow.locator('> p.mb-0').first();
const resultViewCount = resultRow.locator('> p.mb-0 > span.ml-2.opacity-70');
const resultCreatedAt = resultRow.locator('> p.mb-0.opacity-50.text-sm');

await expect(resultTitle).toBeVisible();
await expect(resultTitle).not.toHaveClass(/search-row-title/);
await expect(resultViewCount).toBeVisible();
await expect(resultViewCount).not.toHaveClass(/search-view-count/);
await expect(resultViewCount).toHaveCSS('opacity', '0.7');
await expect(resultCreatedAt).toBeVisible();
await expect(resultCreatedAt).not.toHaveClass(/search-created-at/);
await expect(resultCreatedAt).toHaveCSS('margin-top', '0px');
await expect(resultCreatedAt).toHaveCSS('opacity', '0.5');
await expect(resultCreatedAt).toHaveCSS('font-size', '14px');
```

Update the legacy utility-class test with equivalent result and recent row locators, plus:

```ts
await expect(page.locator('[data-id="search-ranklist-item"] .search-row-title')).toHaveCount(0);
await expect(page.locator('[data-id="search-ranklist-item"] .search-view-count')).toHaveCount(0);
await expect(page.locator('[data-id="search-ranklist-item"] .search-created-at')).toHaveCount(0);
```

- [ ] **Step 2: Run RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "shows Fuse results|renders legacy search list utility class tokens|shows recent ranklists"
```

Expected: FAIL because the Vue route still emits `.search-row-title`, `.search-view-count`, and `.search-created-at`.

### Task 2: GREEN Vue Row Content Markup

- [ ] **Step 1: Implement the minimal row template change**

In both result and recent row templates in `src/client/modules/search/search.view.vue`, change:

```vue
<p class="search-row-title mb-0">
...
<span class="search-view-count ml-2 opacity-70"><EyeOutlined /> {{ item.viewCnt }}</span>
...
<p class="search-created-at mb-0 opacity-50 text-sm">创建于 {{ formatCreatedAt(item.createdAt) }}</p>
```

to:

```vue
<p class="mb-0">
...
<span class="ml-2 opacity-70"><EyeOutlined /> {{ item.viewCnt }}</span>
...
<p class="mb-0 opacity-50 text-sm">创建于 {{ formatCreatedAt(item.createdAt) }}</p>
```

- [ ] **Step 2: Move row presentation to legacy utility styles**

In the scoped style block, replace `.search-row-title`, `.search-view-count`, and `.search-created-at` with:

```less
.mb-0 {
  margin-top: 0;
  margin-bottom: 0;
}

.ml-2 {
  margin-left: 8px;
}

.opacity-70 {
  opacity: 0.7;
}

.opacity-50 {
  opacity: 0.5;
}

.text-sm {
  font-size: 14px;
}
```

- [ ] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "shows Fuse results|renders legacy search list utility class tokens|shows recent ranklists"
```

Expected: PASS for the focused search tests.

### Task 3: Docs, Full Gate, Commit

- [ ] **Step 1: Update migration docs**

Record the slice in:

- `docs/migration/status.md`;
- `docs/migration/manual-acceptance-checklist.md`;
- `docs/migration/final-integration-review.md`.

- [ ] **Step 2: Run the full completed-slice gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, route generation succeeds, migration tests pass, and `git diff --check` has no output.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/client/modules/search/search.view.vue tests/e2e/full-chain/search.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-search-row-content-dom-parity-design.md docs/superpowers/plans/2026-05-27-search-row-content-dom-parity.md
git commit -m "fix: 还原搜索页行内容 DOM"
```

- [ ] **Step 4: Run post-commit checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean `migration/live-page-foundation` branch, latest commit is `fix: 还原搜索页行内容 DOM`, and no whitespace errors.
