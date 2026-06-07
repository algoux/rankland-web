# SRK Modal Root Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `srk-react-modal-root` class on SRK user and solution modal roots.

**Architecture:** Keep using the Vue renderer package's `Modal` and `DefaultSolutionModal`. Pass the missing old class through their existing `root-class-name` prop while preserving `srk-general-modal-root` and current migrated data-id wrappers.

**Tech Stack:** Vue 3 SFC, `@algoux/standard-ranklist-renderer-component-vue`, Playwright full-chain tests, pnpm migration gates.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add modal root class helper**

Add this helper near the other modal/style helpers:

```ts
async function getModalRootClasses(page: Page, wrapperDataId: string) {
  return page.evaluate((dataId) => {
    const modalRoot = document.querySelector<HTMLElement>(`[data-id="${dataId}"] .srk-modal-root`);
    if (!modalRoot) {
      throw new Error(`Missing modal root for ${dataId}`);
    }
    return Array.from(modalRoot.classList);
  }, wrapperDataId);
}
```

- [x] **Step 2: Assert the old user modal root class contract**

After the existing user modal `.srk-modal` visibility assertion, add:

```ts
expect(await getModalRootClasses(page, 'rankland-ranklist-user-modal')).toEqual(
  expect.arrayContaining(['srk-modal-root', 'srk-animated-modal-root', 'srk-react-modal-root', 'srk-general-modal-root']),
);
```

- [x] **Step 3: Assert the old solution modal root class contract**

After the existing solution modal `.srk-modal` visibility assertion, add:

```ts
expect(await getModalRootClasses(page, 'rankland-ranklist-solution-modal')).toEqual(
  expect.arrayContaining(['srk-modal-root', 'srk-animated-modal-root', 'srk-react-modal-root', 'srk-general-modal-root']),
);
```

- [x] **Step 4: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: FAIL because the current modal roots do not include `srk-react-modal-root`.

### Task 2: Restore Modal Root Classes

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Restore the user modal root class**

Change the custom Modal prop from:

```vue
root-class-name="srk-general-modal-root"
```

to:

```vue
root-class-name="srk-general-modal-root srk-react-modal-root"
```

- [x] **Step 2: Restore the solution modal root class**

Add this prop to `DefaultSolutionModal`:

```vue
root-class-name="srk-general-modal-root srk-react-modal-root"
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
- Modify: `docs/superpowers/plans/2026-05-27-srk-modal-root-class-parity.md`

- [x] **Step 1: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: all commands exit 0.

- [x] **Step 2: Update migration docs**

Record `SRK modal root class parity`, focused RED/GREEN evidence, and the full gate result in the migration dashboard, manual checklist, and final integration review.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/superpowers/specs/2026-05-27-srk-modal-root-class-parity-design.md docs/superpowers/plans/2026-05-27-srk-modal-root-class-parity.md docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git commit -m "fix: 还原 SRK 弹窗根节点类名"
```
