# Search Error Message DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `/search` load-error message class contract by removing the Vue-only `.search-error-message` class while preserving `text-red-500` color behavior.

**Architecture:** This is a narrow CSR route DOM parity slice. Full-chain Playwright tests verify the public error DOM emitted by `src/client/modules/search/search.view.vue`, and implementation moves styling to the scoped legacy utility class.

**Tech Stack:** Vue 3 SFC, Ant Design Vue route page, Playwright full-chain E2E, pnpm migration gates.

---

## File Structure

- Modify `tests/e2e/full-chain/search.spec.ts`: assert the error inner node is selected by the old `> div.text-red-500` DOM, has exact `text-red-500` class, and no `.search-error-message` exists.
- Modify `src/client/modules/search/search.view.vue`: remove `.search-error-message` from the template and replace its scoped style rule with `.text-red-500`.
- Modify `docs/migration/status.md`: record the verified search error message DOM parity slice.
- Modify `docs/migration/manual-acceptance-checklist.md`: add the error message DOM/class checkpoint.
- Modify `docs/migration/final-integration-review.md`: record the new search error message evidence.

### Task 1: RED Search Error Message Assertions

**Files:**
- Modify: `tests/e2e/full-chain/search.spec.ts`

- [ ] **Step 1: Write the failing test assertions**

In `tests/e2e/full-chain/search.spec.ts`, update the `renders the legacy search load error color when ranklist initialization fails` test:

```ts
const errorMessage = page.locator('[data-id="search-error"] > div.text-red-500');
await expect(errorMessage).toHaveText('初始化榜单数据库失败，请刷新再试。');
await expect(errorMessage).toHaveClass(/^text-red-500$/);
await expect(errorMessage).toHaveCSS('color', 'rgb(239, 68, 68)');
await expect(page.locator('[data-id="search-error"] .search-error-message')).toHaveCount(0);
```

- [ ] **Step 2: Run RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "renders the legacy search load error color"
```

Expected: FAIL because the current inner node still has `class="search-error-message text-red-500"`.

### Task 2: GREEN Search Error Message Template

**Files:**
- Modify: `src/client/modules/search/search.view.vue`

- [ ] **Step 1: Implement the minimal template change**

Change:

```vue
<div class="search-error-message text-red-500">初始化榜单数据库失败，请刷新再试。</div>
```

to:

```vue
<div class="text-red-500">初始化榜单数据库失败，请刷新再试。</div>
```

- [ ] **Step 2: Move the color rule to the old utility class**

Change the scoped style rule:

```less
.search-error-message {
  color: #ef4444;
}
```

to:

```less
.text-red-500 {
  color: #ef4444;
}
```

- [ ] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "renders the legacy search load error color"
```

Expected: PASS for the focused load-error test.

### Task 3: Docs, Full Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Update migration docs**

Record the slice as Search error message DOM parity and include RED/GREEN evidence plus the full migration gate result.

- [ ] **Step 2: Run the full completed-slice gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, route generation succeeds, migration tests pass, and `git diff --check` has no output.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/client/modules/search/search.view.vue tests/e2e/full-chain/search.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-search-error-message-dom-parity-design.md docs/superpowers/plans/2026-05-27-search-error-message-dom-parity.md
git commit -m "fix: 还原搜索页错误消息 DOM"
```

- [ ] **Step 4: Run post-commit checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean `migration/live-page-foundation` branch, latest commit is `fix: 还原搜索页错误消息 DOM`, and no whitespace errors.
