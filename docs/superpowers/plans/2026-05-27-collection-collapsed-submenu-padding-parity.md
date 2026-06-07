# Collection Collapsed Submenu Padding Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old collection collapsed submenu title `padding: 0` behavior.

**Architecture:** Keep the current Vue collection view and Ant Design Vue menu implementation. Add one full-chain assertion to the existing collection menu test and one scoped `:deep(...)` CSS rule in `collection.view.vue`.

**Tech Stack:** Vue 3 SFC, scoped LESS, Ant Design Vue Menu, Playwright full-chain E2E.

---

### Task 1: Add Failing Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/collection.spec.ts`

- [ ] **Step 1: Extend the collection menu test**

Add this block near the end of `renders the legacy Ant Design collection menu with category icons`, before dark-mode assertions:

```ts
await page.locator('[data-id="collection-collapse-button"]').click();
await expect(page.locator('[data-id="collection-content"]')).toHaveClass(/is-nav-collapsed/);
const collapsedSubmenuTitle = page.locator(
  '[data-id="collection-nav-menu"].ant-menu-inline-collapsed > .ant-menu-submenu > .ant-menu-submenu-title',
).first();
await expect(collapsedSubmenuTitle).toHaveCSS('padding-left', '0px');
await expect(collapsedSubmenuTitle).toHaveCSS('padding-right', '0px');
```

- [ ] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts --grep "legacy Ant Design collection menu"
```

Expected: FAIL because the current collapsed submenu title padding is not `0px`.

### Task 2: Restore Collapsed Submenu Padding

**Files:**
- Modify: `src/client/modules/collection/collection.view.vue`

- [ ] **Step 1: Add the scoped collapsed submenu title rule**

Add this rule near the existing collapsed icon-width rule:

```css
:deep(.ant-menu-inline-collapsed > .ant-menu-submenu > .ant-menu-submenu-title) {
  padding: 0;
}
```

- [ ] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts --grep "legacy Ant Design collection menu"
```

Expected: PASS.

### Task 3: Document, Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Update migration docs**

Record the collection collapsed submenu padding parity slice, including `padding-left: 0px` and `padding-right: 0px`.

- [ ] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS.

- [ ] **Step 3: Commit**

Run:

```bash
git add tests/e2e/full-chain/collection.spec.ts src/client/modules/collection/collection.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-collection-collapsed-submenu-padding-parity-design.md docs/superpowers/plans/2026-05-27-collection-collapsed-submenu-padding-parity.md
git commit -m "fix: 还原合集页折叠菜单内边距"
```

Expected: commit succeeds with a clean worktree afterward.
