# Search Section Content DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `/search` result/recent inner content DOM by removing Vue-only section-title, list, and empty-state wrapper classes.

**Architecture:** Add focused Playwright assertions to existing `/search` result/recent tests, then make route-local Vue template/CSS changes. The change stays in `search.view.vue` and keeps Ant Design Vue List/row behavior intact.

**Tech Stack:** Vue 3 SFC, Ant Design Vue List, Playwright full-chain E2E.

---

### Task 1: RED - capture result/recent inner content DOM parity

**Files:**
- Modify: `tests/e2e/full-chain/search.spec.ts`

- [x] **Step 1: Add recent title/list assertions**

In `shows recent ranklists for an empty query through CSR and listAllRanklists`, after the recent section tag/class assertions, add:

```ts
await expect(page.locator('[data-id="search-recent-section"] > div.opacity-70').first()).toHaveText('最近更新');
await expect(page.locator('[data-id="search-recent-section"] > div.opacity-70').first()).not.toHaveClass(
  /search-section-title/,
);
await expect(page.locator('[data-id="search-recent-section"] > div.mt-2 > .ant-list.ant-list-sm')).toBeVisible();
await expect(page.locator('[data-id="search-recent-section"] .search-list')).toHaveCount(0);
```

- [x] **Step 2: Add empty-state assertions**

In `renders the recent empty state with the legacy mt-2 spacing`, replace the `.search-empty-state` assertions with:

```ts
const recentEmptyState = page.locator('[data-id="search-recent-section"] > div.mt-2', {
  hasText: '暂无最近更新的榜单',
});
await expect(recentEmptyState).toBeVisible();
await expect(recentEmptyState).not.toHaveClass(/search-empty-state/);
await expect(recentEmptyState).toHaveCSS('margin-top', '8px');
await expect(recentEmptyState).toHaveCSS('color', 'rgba(255, 255, 255, 0.85)');
```

- [x] **Step 3: Add result title/list assertions**

In `shows Fuse results for kw query and preserves result count selector`, replace the `.search-section-title` and `.search-list` checks with:

```ts
await expect(page.locator('[data-id="search-result-section"] > div.opacity-70').first()).toContainText(
  '搜索到 1 个结果',
);
await expect(page.locator('[data-id="search-result-section"] > div.opacity-70').first()).not.toHaveClass(
  /search-section-title/,
);
await expect(page.locator('[data-id="search-result-section"] > div.mt-2 > .ant-list.ant-list-sm')).toBeVisible();
await expect(page.locator('[data-id="search-result-section"] .search-list')).toHaveCount(0);
```

- [x] **Step 4: Update utility-class list wrapper assertions**

In `renders legacy search list utility class tokens`, replace the result/recent `.search-list` assertions with:

```ts
await expect(page.locator('[data-id="search-result-section"] > div.mt-2')).toBeVisible();
await expect(page.locator('[data-id="search-result-section"] > div.mt-2')).toHaveClass(/mt-2/);
await expect(page.locator('[data-id="search-result-section"] > div.mt-2 > .ant-list')).toBeVisible();
await expect(page.locator('[data-id="search-recent-section"] > div.mt-2')).toBeVisible();
await expect(page.locator('[data-id="search-recent-section"] > div.mt-2')).toHaveClass(/mt-2/);
await expect(page.locator('[data-id="search-recent-section"] > div.mt-2 > .ant-list')).toBeVisible();
```

- [x] **Step 5: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "shows recent ranklists|renders the recent empty state|shows Fuse results|renders legacy search list utility class tokens"
```

Expected: FAIL because current Vue title nodes carry `.search-section-title`, list roots carry `.search-list`, and empty state carries `.search-empty-state`.

Result: FAIL reproduced the content DOM gap. Title nodes still carried `.search-section-title`, the empty-state node still carried `.search-empty-state`, and the list was not under the old `div.mt-2 > .ant-list` wrapper.

### Task 2: GREEN - restore old result/recent content wrappers

**Files:**
- Modify: `src/client/modules/search/search.view.vue`

- [x] **Step 1: Restore result content DOM**

Replace:

```vue
<div class="search-section-title opacity-70">搜索到 <span data-id="search-result-count">{{ searchRows.length }}</span> 个结果</div>
<a-list v-if="searchRows.length > 0" class="search-list mt-2" size="small" :data-source="searchRows">
  ...
</a-list>
```

with:

```vue
<div class="opacity-70">搜索到 <span data-id="search-result-count">{{ searchRows.length }}</span> 个结果</div>
<div v-if="searchRows.length > 0" class="mt-2">
  <a-list size="small" :data-source="searchRows">
    ...
  </a-list>
</div>
```

- [x] **Step 2: Restore recent content DOM**

Replace:

```vue
<div class="search-section-title opacity-70">最近更新</div>
<div v-if="recentRows.length === 0" class="search-empty-state mt-2">暂无最近更新的榜单</div>
<a-list v-else class="search-list mt-2" size="small" :data-source="recentRows">
  ...
</a-list>
```

with:

```vue
<div class="opacity-70">最近更新</div>
<div v-if="recentRows.length === 0" class="mt-2">暂无最近更新的榜单</div>
<div v-else class="mt-2">
  <a-list size="small" :data-source="recentRows">
    ...
  </a-list>
</div>
```

- [x] **Step 3: Replace Vue-only CSS hooks with old utility class**

Delete:

```less
.search-section-title {
  opacity: 0.7;
}

.search-list {
  margin: 8px 0 0;
}

.search-empty-state {
  margin-top: 8px;
  color: var(--rankland-legacy-text-color);
}
```

Add:

```less
.mt-2 {
  margin-top: 8px;
}
```

Keep row-level `.search-list-item`, `.search-row-title`, `.search-view-count`, and `.search-created-at` styles unchanged.

Implementation note: removing `.search-empty-state` exposed Ant Design Vue's newer default text color in the empty state, so `.normal-content` now inherits `var(--rankland-legacy-text-color)` to preserve the old React/Ant Design body text color without restoring a Vue-only empty-state hook.

- [x] **Step 4: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "shows recent ranklists|renders the recent empty state|shows Fuse results|renders legacy search list utility class tokens"
```

Expected: PASS.

Result: PASS. The focused `/search` full-chain tests verified old `div.opacity-70` titles, old `div.mt-2 > .ant-list` list wrappers, no `.search-section-title`, no `.search-list`, no `.search-empty-state`, and preserved dark empty-state text color.

### Task 3: Full verification, docs, commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, route generation succeeds, migration tests pass, and whitespace check passes.

Result: PASS. Full gate used Node `v24.11.1`, pnpm `8.15.9`, generated 8 client routes, passed build, 35 unit files / 151 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 59 passed / 1 skipped full-chain tests; `git diff --check` passed.

- [x] **Step 2: Update migration docs**

Record Search section content DOM parity in the current focus, route progress coverage, manual checklist, final integration review, and next recommended focus.

- [ ] **Step 3: Commit**

Run:

```bash
git add tests/e2e/full-chain/search.spec.ts src/client/modules/search/search.view.vue docs/superpowers/specs/2026-05-27-search-section-content-dom-parity-design.md docs/superpowers/plans/2026-05-27-search-section-content-dom-parity.md docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git commit -m "fix: 还原搜索页内容外层 DOM"
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: commit succeeds on `migration/live-page-foundation`, post-checks pass.
