# SRK Controls Utility Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React SRK controls utility class tokens while preserving the existing Vue controls behavior.

**Architecture:** Keep the shared `RanklandRanklist` controls row and scoped CSS. Add class-token assertions to the existing ranklist full-chain route, then append the old utility classes beside migrated hooks in `rankland-ranklist.vue`.

**Tech Stack:** Vue 3 SFC, scoped Less, Ant Design Vue, Playwright full-chain tests, pnpm migration gates.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add controls utility class helper**

Add this helper near `getFilterControlSpacing`:

```ts
async function getControlsUtilityClasses(page: Page) {
  return page.evaluate(() => {
    const controls = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-controls"]');
    const organizationFilter = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-organization-filter"]');
    const officialFilter = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-official-filter"]');
    const markerFilter = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-marker-filter"]');
    const officialWrapper = officialFilter?.closest<HTMLElement>('.rankland-ranklist-checkbox');
    const officialText = Array.from(officialWrapper?.children || []).find(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element.textContent?.trim() === '仅正式参赛',
    );
    if (!controls || !organizationFilter || !officialWrapper || !officialText || !markerFilter) {
      throw new Error('Missing ranklist controls utility class targets');
    }
    return {
      controlsClasses: Array.from(controls.classList),
      organizationFilterClasses: Array.from(organizationFilter.classList),
      officialWrapperClasses: Array.from(officialWrapper.classList),
      officialTextClasses: Array.from(officialText.classList),
      markerFilterClasses: Array.from(markerFilter.classList),
    };
  });
}
```

- [x] **Step 2: Assert old controls utility class tokens**

In the main `/ranklist/:id` full-chain test, after the existing `getFilterControlSpacing` assertion, add:

```ts
expect(await getControlsUtilityClasses(page)).toMatchObject({
  controlsClasses: expect.arrayContaining(['rankland-ranklist-controls', 'mt-3', 'mx-4', 'flex', 'justify-between', 'items-center']),
  organizationFilterClasses: expect.arrayContaining(['rankland-ranklist-select', 'ml-2']),
  officialWrapperClasses: expect.arrayContaining([
    'rankland-ranklist-filter',
    'rankland-ranklist-checkbox',
    'ml-5',
    'inline-flex',
    'items-center',
  ]),
  officialTextClasses: expect.arrayContaining(['mr-1']),
  markerFilterClasses: expect.arrayContaining(['rankland-ranklist-marker-filter', 'ml-5', 'inline-flex', 'items-center']),
});
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders legacy Ant Design filter controls"
```

Expected: FAIL because the current Vue controls lack the old utility class tokens.

### Task 2: Restore Controls Utility Class Tokens

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Add old classes to the controls root and controls**

Change the controls template to:

```vue
<div
  v-if="showFilter || hasExtraAction"
  data-id="rankland-ranklist-controls"
  class="rankland-ranklist-controls mt-3 mx-4 flex justify-between items-center"
>
  ...
  <a-select
    ...
    class="rankland-ranklist-select ml-2"
  >
  ...
  <label class="rankland-ranklist-filter rankland-ranklist-checkbox ml-5 inline-flex items-center">
    <span class="mr-1">仅正式参赛</span>
    <a-switch ... />
  </label>
  <a-radio-group
    ...
    class="rankland-ranklist-marker-filter ml-5 inline-flex items-center"
  >
```

Keep control text, props, v-model bindings, and filter behavior unchanged.

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders legacy Ant Design filter controls"
```

Expected: PASS.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Update migration docs**

Record SRK controls utility class parity in the route row, SRK wrapper summary, manual checklist ranklist notes, and final integration review.

- [x] **Step 2: Run the full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: all commands pass.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-srk-controls-utility-class-parity-design.md docs/superpowers/plans/2026-05-27-srk-controls-utility-class-parity.md
git commit -m "fix: 还原 SRK 控件行旧版工具类"
```
