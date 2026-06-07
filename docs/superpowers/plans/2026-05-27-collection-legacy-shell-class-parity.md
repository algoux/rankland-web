# Collection Legacy Shell Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old collection shell class names and nav z-index while keeping the verified Vue collection behavior stable.

**Architecture:** Add legacy classes alongside existing Vue classes in `collection.view.vue` and keep existing `data-id` selectors untouched. Use the existing full-chain collection menu/chrome test to prove the old shell contract and z-index.

**Tech Stack:** Vue 3 SFC, Ant Design Vue, Playwright full-chain E2E, RankLand mock backend.

---

### Task 1: Add Failing Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/collection.spec.ts`

- [ ] **Step 1: Extend the collection menu/chrome test**

Add these assertions to `renders the legacy Ant Design collection menu with category icons` after the page response is verified:

```ts
await expect(page.locator('[data-id="collection-content"]')).toHaveClass(/srk-collection-container/);
await expect(page.locator('[data-id="collection-nav"]')).toHaveClass(/srk-collection-nav/);
await expect(page.locator('[data-id="collection-ranklist-panel"]')).toHaveClass(/srk-collection-ranklist/);
await expect(page.locator('[data-id="collection-nav"]')).toHaveCSS('z-index', '1');
await expect(page.locator('.srk-collection-hidden-header')).toHaveCSS('z-index', 'auto');
```

- [ ] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts --grep "legacy Ant Design collection menu"
```

Expected: FAIL because the current Vue collection shell does not expose the legacy shell classes, nav z-index is `10`, and the hidden header has explicit `z-index: 1`.

### Task 2: Restore Legacy Shell Class Contract

**Files:**
- Modify: `src/client/modules/collection/collection.view.vue`

- [ ] **Step 1: Add legacy shell classes**

Update the collection content section, nav aside, and ranklist panel classes:

```vue
<section
  v-else
  data-id="collection-content"
  class="srk-collection-container collection-page"
  :class="{ 'is-nav-collapsed': collapsed, 'is-mobile-layout': isMobileLayout }"
>
```

```vue
<aside
  data-id="collection-nav"
  class="srk-collection-nav collection-nav"
  ...
>
```

```vue
<section
  data-id="collection-ranklist-panel"
  class="srk-collection-ranklist collection-ranklist-panel"
  :style="ranklistPanelStyle"
>
```

- [ ] **Step 2: Restore nav z-index**
- [ ] **Step 2: Restore nav and hidden-header z-index**

Change the `.collection-nav` z-index rule to:

```css
z-index: 1;
```

Remove the explicit `z-index: 1;` from `.collection-hidden-header` so the computed value is `auto` and it does not intercept clicks over the nav.

- [ ] **Step 3: Run focused GREEN**

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

Record the collection legacy shell class parity slice, including `.srk-collection-container`, `.srk-collection-nav`, `.srk-collection-ranklist`, nav `z-index: 1`, and hidden-header `z-index: auto`.

- [ ] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS.

- [ ] **Step 3: Commit**

Run:

```bash
git add tests/e2e/full-chain/collection.spec.ts src/client/modules/collection/collection.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-collection-legacy-shell-class-parity-design.md docs/superpowers/plans/2026-05-27-collection-legacy-shell-class-parity.md
git commit -m "fix: 还原合集页旧版外壳类名"
```

Expected: commit succeeds with a clean worktree afterward.
