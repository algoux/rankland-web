# SRK Table Top Spacing Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `mt-6` vertical gap before the shared SRK table wrapper.

**Architecture:** Keep the existing shared `RanklandRanklist` table wrapper and route-provided `tableClass`. Bind a local wrapper class alongside `tableClass`, then set `margin-top: 24px` in scoped LESS so adjacent vertical margins collapse to the old effective gap.

**Tech Stack:** Vue 3 SFC, scoped LESS, Playwright full-chain tests, pnpm.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add controls-to-table gap helper**

Add this helper near the other ranklist layout helpers:

```ts
async function getControlsToTableGap(page: Page) {
  return page.evaluate(() => {
    const controls = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-controls"]');
    const tableWrapper = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-table-wrapper"]');
    if (!controls || !tableWrapper) {
      throw new Error('Missing ranklist controls or table wrapper');
    }
    return Math.round(tableWrapper.getBoundingClientRect().top - controls.getBoundingClientRect().bottom);
  });
}
```

- [x] **Step 2: Assert the old `mt-6` gap**

In the main `/ranklist/:id` full-chain test, after the existing table wrapper margin-left assertion, add:

```ts
expect(await getControlsToTableGap(page)).toBe(24);
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: fail because the current Vue layout measures a `16px` controls-to-table gap.

### Task 2: Restore Shared Table Top Spacing

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Bind a stable local table wrapper class**

Change the table wrapper to bind the local class and the route-provided class:

```vue
<div data-id="rankland-ranklist-table-wrapper" :class="['rankland-ranklist-table-wrapper', tableClass]">
```

- [x] **Step 2: Add the old `mt-6` spacing**

Add near the existing `.ml-4` utility:

```less
.rankland-ranklist-table-wrapper {
  margin-top: 24px;
}
```

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: all ranklist full-chain tests pass.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-srk-table-top-spacing-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration dashboard**

Record SRK table top-spacing parity in the current slice, `/ranklist/:id` coverage, SRK Vue wrapper status, deferred product decisions, and known risks.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-srk-table-top-spacing-parity-design.md docs/superpowers/plans/2026-05-26-srk-table-top-spacing-parity.md
git commit -m "feat: 收口 SRK 表格前间距一致性"
```
