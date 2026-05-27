# Search Error DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `/search` initialization-error DOM/class structure in the Vue route.

**Architecture:** Keep the existing CSR search page and RanklandApiService flow. Add full-chain coverage for the old two-level error state, then move the red class from the outer wrapper to an inner message node.

**Tech Stack:** Vue 3 SFC, Ant Design Vue, Playwright full-chain tests, pnpm migration gates.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/search.spec.ts`

- [x] **Step 1: Add old error DOM assertions**

In `renders the legacy search load error color when ranklist initialization fails`, replace the current same-node color/class assertions with:

```ts
await expect(page.locator('[data-id="search-error"]')).toHaveText(
  '初始化榜单数据库失败，请刷新再试。',
);
await expect(page.locator('[data-id="search-error"]')).toHaveClass(/mt-10/);
await expect(page.locator('[data-id="search-error"]')).not.toHaveClass(/text-red-500/);
await expect(page.locator('[data-id="search-error"]')).toHaveCSS('margin-top', '40px');
await expect(page.locator('[data-id="search-error"] .search-error-message')).toHaveText(
  '初始化榜单数据库失败，请刷新再试。',
);
await expect(page.locator('[data-id="search-error"] .search-error-message')).toHaveClass(/text-red-500/);
await expect(page.locator('[data-id="search-error"] .search-error-message')).toHaveCSS('color', 'rgb(239, 68, 68)');
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts --grep "renders the legacy search load error color"
```

Expected: FAIL because the outer error wrapper still carries `text-red-500` and no inner `.search-error-message` exists.

### Task 2: Restore Old Error DOM Structure

**Files:**
- Modify: `src/client/modules/search/search.view.vue`

- [x] **Step 1: Move the red class to an inner message node**

Change the error block to:

```vue
<div v-else-if="loadError" data-id="search-error" class="search-state mt-10">
  <div class="search-error-message text-red-500">初始化榜单数据库失败，请刷新再试。</div>
</div>
```

Change the scoped style selector from `.search-error` to `.search-error-message`:

```less
.search-error-message {
  color: #ef4444;
}
```

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts --grep "renders the legacy search load error color"
```

Expected: PASS.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-27-search-error-dom-parity.md`

- [x] **Step 1: Update migration docs**

Record search error DOM/class parity in the search route coverage, manual checklist search notes, and final integration review.

- [x] **Step 2: Run the full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: all commands pass.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/modules/search/search.view.vue tests/e2e/full-chain/search.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-search-error-dom-parity-design.md docs/superpowers/plans/2026-05-27-search-error-dom-parity.md
git commit -m "fix: 还原搜索错误态旧版 DOM"
```
