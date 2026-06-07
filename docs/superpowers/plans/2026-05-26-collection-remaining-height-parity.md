# Collection Remaining Height Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old Collection page's remaining-height calculation and nav-width-driven animation behavior in the Vue route.

**Architecture:** Add a small `collection-layout.ts` helper so height and width rules are unit-testable outside Vue. Keep `collection.view.vue` as the route owner, but feed all inline style values from the helper-derived computed state. Use full-chain Playwright coverage for browser-computed styles and mobile/desktop behavior.

**Tech Stack:** Vue 3, TypeScript, Vitest, Playwright full-chain E2E, Ant Design Vue 4.

---

### Task 1: Red Tests

**Files:**
- Create: `tests/unit/collection-layout.spec.ts`
- Modify: `tests/e2e/full-chain/collection.spec.ts`

- [x] **Step 1: Add helper unit tests**

Create unit tests that import `getCollectionRemainingHeight` and `getCollectionLayoutState` from `@client/modules/collection/collection-layout`. Cover body/header remaining height, clamping, desktop widths, mobile widths, menu height, desktop ranklist margin-left, and mobile panel display.

- [x] **Step 2: Add browser style assertions**

Extend the existing Collection full-chain spec with desktop and mobile layout parity assertions against `[data-id="collection-nav"]`, `[data-id="collection-nav-menu"]`, `[data-id="collection-collapse-button"]`, and `[data-id="collection-ranklist-panel"]`.

- [x] **Step 3: Run focused tests and confirm RED**

Run:

```bash
corepack pnpm exec vitest run tests/unit/collection-layout.spec.ts
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts
```

Expected: unit test fails because `collection-layout.ts` does not exist; full-chain style assertions fail because the current page still uses CSS viewport height/fixed margin rules.

### Task 2: Layout Helper

**Files:**
- Create: `src/client/modules/collection/collection-layout.ts`

- [x] **Step 1: Add constants and remaining-height helper**

Export `COLLECTION_MOBILE_LAYOUT_WIDTH`, `COLLECTION_DESKTOP_NAV_WIDTH`, `COLLECTION_COLLAPSED_NAV_WIDTH`, `COLLECTION_NAV_BUTTON_HEIGHT`, and `COLLECTION_WIDTH_TRANSITION`. Implement `getCollectionRemainingHeight({ bodyClientHeight, headerHeight })` with non-negative clamping.

- [x] **Step 2: Add layout-state helper**

Implement `getCollectionLayoutState({ clientWidth, remainingHeight, collapsed })` returning `isMobileLayout`, `navWidth`, `menuHeight`, `ranklistMarginLeft`, and `ranklistDisplay`.

- [x] **Step 3: Run helper unit tests**

Run:

```bash
corepack pnpm exec vitest run tests/unit/collection-layout.spec.ts
```

Expected: PASS.

### Task 3: Vue Integration

**Files:**
- Modify: `src/client/modules/collection/collection.view.vue`

- [x] **Step 1: Import layout helper**

Replace local layout constants with imports from `collection-layout.ts`.

- [x] **Step 2: Track remaining height**

Add `remainingHeight` and a body `ResizeObserver`. Update `updateViewportState()` to compute remaining height from `document.body.clientHeight` and `.ant-layout-header`.

- [x] **Step 3: Apply helper-derived styles**

Add computed styles for nav, collapse button, menu, hidden header, and ranklist panel. Bind those styles in the template with stable data attributes for layout assertions.

- [x] **Step 4: Preserve existing behavior**

Keep localStorage collapse persistence, Ant Design Vue menu item generation, mobile auto-collapse, invalid `rankId` cleanup, and SSR data loading unchanged.

- [x] **Step 5: Run focused Collection full-chain spec**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts
```

Expected: PASS.

### Task 4: Gates, Docs, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/superpowers/plans/2026-05-26-collection-remaining-height-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration docs**

Record Collection remaining-height/pixel animation parity as verified, move the remaining Collection risk out of the route table, and update the next-slice queue.

- [x] **Step 3: Commit the slice**

Run:

```bash
git status --short
git add src/client/modules/collection/collection-layout.ts src/client/modules/collection/collection.view.vue tests/unit/collection-layout.spec.ts tests/e2e/full-chain/collection.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/superpowers/specs/2026-05-26-collection-remaining-height-parity-design.md docs/superpowers/plans/2026-05-26-collection-remaining-height-parity.md
git commit -m "feat: 收口合集页高度动画一致性"
```

Expected: commit succeeds with only this slice's files.
