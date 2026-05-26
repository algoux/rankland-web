# SRK Header Action Utility Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React SRK header action utility class tokens while preserving existing Ant Design Vue action behavior.

**Architecture:** Keep the shared `RanklandRanklist` header action structure and scoped CSS. Add class-token assertions to existing ranklist and live full-chain scenarios, then append the old utility classes beside migrated hooks in `rankland-ranklist.vue`.

**Tech Stack:** Vue 3 SFC, scoped Less, Ant Design Vue, Playwright full-chain tests, pnpm migration gates.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [x] **Step 1: Add ranklist action class assertions**

In the main `/ranklist/:id` full-chain test, after the existing action trigger visibility/icon assertions, add:

```ts
await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toHaveClass(/(^|\s)border-0(\s|$)/);
await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toHaveClass(/(^|\s)border-solid(\s|$)/);
await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toHaveClass(/(^|\s)border-gray-400(\s|$)/);
await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toHaveClass(/(^|\s)mr-2(\s|$)/);
await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toHaveClass(/(^|\s)pl-2(\s|$)/);
await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toHaveClass(/(^|\s)border-l(\s|$)/);
await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"]')).toHaveClass(/(^|\s)pl-2(\s|$)/);
await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"]')).toHaveClass(/(^|\s)border-0(\s|$)/);
await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"]')).toHaveClass(/(^|\s)border-l(\s|$)/);
await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"]')).toHaveClass(/(^|\s)border-solid(\s|$)/);
await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"]')).toHaveClass(/(^|\s)border-gray-400(\s|$)/);
```

- [x] **Step 2: Add live no-metadata action class assertions**

In the main `/live/:id` full-chain test, after action trigger visibility checks, add:

```ts
await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toHaveClass(/(^|\s)border-0(\s|$)/);
await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toHaveClass(/(^|\s)border-solid(\s|$)/);
await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toHaveClass(/(^|\s)border-gray-400(\s|$)/);
await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toHaveClass(/(^|\s)mr-2(\s|$)/);
await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).not.toHaveClass(/(^|\s)pl-2(\s|$)/);
await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).not.toHaveClass(/(^|\s)border-l(\s|$)/);
await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"]')).toHaveClass(/(^|\s)pl-2(\s|$)/);
await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"]')).toHaveClass(/(^|\s)border-0(\s|$)/);
await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"]')).toHaveClass(/(^|\s)border-l(\s|$)/);
await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"]')).toHaveClass(/(^|\s)border-solid(\s|$)/);
await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"]')).toHaveClass(/(^|\s)border-gray-400(\s|$)/);
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts --grep "renders the ranklist detail page|hydrates the CSR live page"
```

Expected: FAIL because the current Vue action triggers lack the old utility class tokens.

### Task 2: Restore Action Utility Class Tokens

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Add old classes to export/share action triggers**

Change the export/share buttons to:

```vue
<a-button
  data-id="rankland-ranklist-export-menu-button"
  :class="[
    'rankland-ranklist-header-action-trigger border-0 border-solid border-gray-400 mr-2',
    { 'rankland-ranklist-header-action-separated pl-2 border-l': hasViewCount },
  ]"
  ...
>
```

```vue
<a-button
  data-id="rankland-ranklist-share-menu-button"
  class="rankland-ranklist-header-action-trigger rankland-ranklist-header-action-separated pl-2 border-0 border-l border-solid border-gray-400"
  ...
>
```

Keep props, icons, dropdowns, actions, and existing scoped styles unchanged.

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts --grep "renders the ranklist detail page|hydrates the CSR live page"
```

Expected: PASS.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Update migration docs**

Record SRK header action utility class parity in the route row, SRK wrapper summary, manual checklist ranklist notes, live notes, and final integration review.

- [x] **Step 2: Run the full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: all commands pass.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-srk-header-action-utility-class-parity-design.md docs/superpowers/plans/2026-05-27-srk-header-action-utility-class-parity.md
git commit -m "fix: 还原 SRK 头部操作旧版工具类"
```
