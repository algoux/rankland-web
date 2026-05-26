# Collection Product Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore collection navigation product parity with Ant Design Vue inline menu, category icons, and old mobile collapse behavior.

**Architecture:** Keep `collection.view.vue` as the route owner and replace `collection-tree-item.vue` recursion with menu item data generated from the collection tree. Add a small category-icon helper and copied image assets under the collection module. Keep SSR data loading unchanged, mount Ant Design Vue Menu through `ClientOnly` to avoid its ResizeObserver hydration mismatch, and run UI parity through full-chain Playwright.

**Tech Stack:** Vue 3, vite-ssr, ant-design-vue 4, Playwright full-chain E2E.

---

### Task 1: Red Tests

**Files:**
- Modify: `tests/e2e/full-chain/collection.spec.ts`

- [x] **Step 1: Add product parity assertions**

Add assertions for Ant Design Vue menu classes, category icons, selected menu state, collapse button classes/icons, and mobile default collapse behavior.

- [x] **Step 2: Run focused collection spec and confirm RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts
```

Expected: fail because the current page still uses a custom tree and button.

### Task 2: Collection Menu Helpers And Assets

**Files:**
- Create: `src/client/modules/collection/assets/*_logo_black.png`
- Create: `src/client/modules/collection/assets/*_logo_white.png`
- Create: `src/client/modules/collection/collection-category-icons.ts`
- Modify: `src/client/modules/collection/collection.view.vue`

- [x] **Step 1: Copy category icon assets**

Copy ICPC, CCPC, provincial CPC, and university-level CPC light/dark images from `rankland-fe/src/assets` into the Vue collection module.

- [x] **Step 2: Add category icon helper**

Map known directory keys to `{ light, dark, alt }`, returning `undefined` for unknown directories.

### Task 3: Ant Design Vue Menu Implementation

**Files:**
- Modify: `src/client/modules/collection/collection.view.vue`
- Delete if no longer used: `src/client/modules/collection/collection-tree-item.vue`

- [x] **Step 1: Replace the custom tree with `a-menu`**

Generate menu items from `collection.root.children`. Directory labels keep stable data attributes and optional icon image. File labels use a link-like span with stable data attributes; navigation is handled by `a-menu` click. Mount `a-menu` through `ClientOnly` because Ant Design Vue's ResizeObserver wrapper is not SSR hydration stable.

- [x] **Step 2: Restore collapse control**

Use `a-button` with Ant Design-compatible fold/unfold icon classes, preserving `CollectionNavCollapsed` localStorage behavior.

- [x] **Step 3: Restore mobile collapse behavior**

Track mobile viewport state after hydration. If no explicit stored preference exists and a valid `rankId` is selected on mobile, default the nav to collapsed. Hide the ranklist panel while mobile nav is expanded and collapse after mobile ranklist selection.

- [x] **Step 4: Run focused collection spec and confirm GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts
```

Expected: pass.

### Task 4: Gates And Docs

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-collection-product-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration docs**

Record Collection product parity progress, verification evidence, and remaining collection risks in `docs/migration/status.md`.
