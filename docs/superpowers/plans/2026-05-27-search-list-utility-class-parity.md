# Search List Utility Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore legacy `/search` list utility class tokens without changing visual behavior or data flow.

**Architecture:** Add focused full-chain assertions for old class tokens on both search-result and recent-list branches, then append the legacy utility class tokens beside the existing `search-*` classes in `search.view.vue`.

**Tech Stack:** Vue 3 Options API, Ant Design Vue `a-input-search` and `a-list`, Playwright full-chain E2E.

---

### Task 1: Full-Chain RED

**Files:**
- Modify: `tests/e2e/full-chain/search.spec.ts`

- [ ] **Step 1: Add the failing class-token test**

Add a full-chain test named `renders legacy search list utility class tokens` that:

```ts
await page.goto('/search?kw=Test%202024');
await expect(page.locator('[data-id="search-result-section"]')).toHaveClass(/mt-10/);
await expect(page.locator('[data-id="search-result-section"] .search-section-title')).toHaveClass(/opacity-70/);
await expect(page.locator('[data-id="search-result-section"] .search-list')).toHaveClass(/mt-2/);
await expect(page.locator('[data-id="search-result-section"] .search-row-title')).toHaveClass(/mb-0/);
await expect(page.locator('[data-id="search-result-section"] .search-view-count')).toHaveClass(/ml-2/);
await expect(page.locator('[data-id="search-result-section"] .search-view-count')).toHaveClass(/opacity-70/);
await expect(page.locator('[data-id="search-result-section"] .search-created-at')).toHaveClass(/mb-0/);
await expect(page.locator('[data-id="search-result-section"] .search-created-at')).toHaveClass(/opacity-50/);
await expect(page.locator('[data-id="search-result-section"] .search-created-at')).toHaveClass(/text-sm/);
await page.goto('/search');
await expect(page.locator('[data-id="search-recent-section"]')).toHaveClass(/mt-10/);
await expect(page.locator('[data-id="search-recent-section"] .search-list')).toHaveClass(/mt-2/);
await expect(page.locator('[data-id="search-recent-section"] .search-row-title').first()).toHaveClass(/mb-0/);
await expect(page.locator('[data-id="search-recent-section"] .search-view-count').first()).toHaveClass(/ml-2/);
await expect(page.locator('[data-id="search-recent-section"] .search-view-count').first()).toHaveClass(/opacity-70/);
await expect(page.locator('[data-id="search-recent-section"] .search-created-at').first()).toHaveClass(/mb-0/);
await expect(page.locator('[data-id="search-recent-section"] .search-created-at').first()).toHaveClass(/opacity-50/);
await expect(page.locator('[data-id="search-recent-section"] .search-created-at').first()).toHaveClass(/text-sm/);
```

- [ ] **Step 2: Verify RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts --grep "renders legacy search list utility class tokens"
```

Expected: FAIL because the old utility tokens are missing.

### Task 2: Vue Template Fix

**Files:**
- Modify: `src/client/modules/search/search.view.vue`

- [ ] **Step 1: Add legacy utility class tokens**

Update the search-result and recent-list branch templates:

```vue
class="search-section mt-10"
class="search-section-title opacity-70"
class="search-list mt-2"
class="search-row-title mb-0"
class="search-view-count ml-2 opacity-70"
class="search-created-at mb-0 opacity-50 text-sm"
```

Keep every existing `search-*` class and `data-id`.

- [ ] **Step 2: Verify GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts --grep "renders legacy search list utility class tokens"
```

Expected: PASS.

### Task 3: Docs, Full Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Update migration docs**

Record search list utility class parity under `/search`, the focused RED/GREEN result, and the full gate result.

- [ ] **Step 2: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: all commands pass; full-chain count increases by one.

- [ ] **Step 3: Commit**

Run:

```bash
git add docs/superpowers/specs/2026-05-27-search-list-utility-class-parity-design.md docs/superpowers/plans/2026-05-27-search-list-utility-class-parity.md tests/e2e/full-chain/search.spec.ts src/client/modules/search/search.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git commit -m "fix: 还原搜索列表旧版工具类"
```
