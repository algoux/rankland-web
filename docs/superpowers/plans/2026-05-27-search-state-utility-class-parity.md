# Search State Utility Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore legacy `/search` loading and error state utility class tokens.

**Architecture:** Extend existing full-chain loading/error tests with old class-token assertions, then append the legacy utility classes to the existing Vue state nodes.

**Tech Stack:** Vue 3 Options API, Ant Design Vue `a-spin`, Playwright full-chain E2E.

---

### Task 1: Full-Chain RED

**Files:**
- Modify: `tests/e2e/full-chain/search.spec.ts`

- [ ] **Step 1: Add class-token assertions to existing state tests**

In `renders the legacy Ant Design loading spinner while ranklists are loading`, assert:

```ts
await expect(page.locator('[data-id="search-loading"]')).toHaveClass(/mt-10/);
```

In `renders the legacy search load error color when ranklist initialization fails`, assert:

```ts
await expect(page.locator('[data-id="search-error"]')).toHaveClass(/mt-10/);
await expect(page.locator('[data-id="search-error"]')).toHaveClass(/text-red-500/);
```

- [ ] **Step 2: Verify RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts --grep "legacy Ant Design loading spinner|legacy search load error color"
```

Expected: FAIL because `mt-10` / `text-red-500` are missing.

### Task 2: Vue Template Fix

**Files:**
- Modify: `src/client/modules/search/search.view.vue`

- [ ] **Step 1: Add the old utility classes**

Update the state nodes:

```vue
<a-spin v-if="loading" data-id="search-loading" class="search-state mt-10" />

<div v-else-if="loadError" data-id="search-error" class="search-state search-error mt-10 text-red-500">
  初始化榜单数据库失败，请刷新再试。
</div>
```

- [ ] **Step 2: Verify GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts --grep "legacy Ant Design loading spinner|legacy search load error color"
```

Expected: PASS.

### Task 3: Docs, Full Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Update migration docs**

Record search state utility class parity under `/search`, the focused RED/GREEN result, and full gate evidence.

- [ ] **Step 2: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: all commands pass; full-chain count remains 56 because this slice extends existing tests.

- [ ] **Step 3: Commit**

Run:

```bash
git add docs/superpowers/specs/2026-05-27-search-state-utility-class-parity-design.md docs/superpowers/plans/2026-05-27-search-state-utility-class-parity.md tests/e2e/full-chain/search.spec.ts src/client/modules/search/search.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git commit -m "fix: 还原搜索状态旧版工具类"
```
