# SRK Table Spacer DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `div.mt-6` spacer DOM before the shared SRK table wrapper without changing the verified 24px visual gap.

**Architecture:** Keep the shared `RanklandRanklist` table wrapper and route-provided `tableClass`. Insert a dedicated spacer before the wrapper and move the 24px spacing from the Vue-only wrapper class to the old `mt-6` utility class.

**Tech Stack:** Vue 3 SFC, scoped LESS, Playwright full-chain tests, pnpm migration gates.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add table spacer style helper**

Add this helper near `getControlsToTableGap`:

```ts
async function getTableSpacerStyle(page: Page) {
  return page.evaluate(() => {
    const spacer = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-table-spacer"]');
    const tableWrapper = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-table-wrapper"]');
    if (!spacer || !tableWrapper) {
      throw new Error('Missing ranklist table spacer or wrapper');
    }
    const spacerStyle = window.getComputedStyle(spacer);
    const tableWrapperStyle = window.getComputedStyle(tableWrapper);
    return {
      spacerClasses: Array.from(spacer.classList),
      spacerMarginTop: spacerStyle.marginTop,
      tableWrapperMarginTop: tableWrapperStyle.marginTop,
    };
  });
}
```

- [x] **Step 2: Assert old spacer DOM and spacing**

In the main `/ranklist/:id` full-chain test, after the existing controls-to-table gap assertion, add:

```ts
expect(await getTableSpacerStyle(page)).toEqual({
  spacerClasses: expect.arrayContaining(['rankland-ranklist-table-spacer', 'mt-6']),
  spacerMarginTop: '24px',
  tableWrapperMarginTop: '0px',
});
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: FAIL with `Missing ranklist table spacer or wrapper`.

### Task 2: Restore Spacer DOM

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Insert the spacer before the table wrapper**

Change the table area to:

```vue
<div data-id="rankland-ranklist-table-spacer" class="rankland-ranklist-table-spacer mt-6" />
<div data-id="rankland-ranklist-table-wrapper" :class="['rankland-ranklist-table-wrapper', tableClass]">
```

- [x] **Step 2: Move spacing to the old utility class**

Replace:

```less
.rankland-ranklist-table-wrapper {
  margin-top: 24px;
}
```

with:

```less
.rankland-ranklist-table-spacer {
  height: 0;
}

.mt-6 {
  margin-top: 24px;
}
```

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: PASS.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-27-srk-table-spacer-dom-parity.md`

- [x] **Step 1: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: all commands exit 0.

- [x] **Step 2: Update migration docs**

Record `SRK table spacer DOM parity`, focused RED/GREEN evidence, and the full gate result in the migration dashboard, manual checklist, and final integration review.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/superpowers/specs/2026-05-27-srk-table-spacer-dom-parity-design.md docs/superpowers/plans/2026-05-27-srk-table-spacer-dom-parity.md docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git commit -m "fix: 还原 SRK 表格前置间隔 DOM"
```
