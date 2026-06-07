# SRK Controls Empty Extra-Action DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `StyledRanklistRenderer` controls-row empty right-side `DIV` when no extra action is provided.

**Architecture:** Keep the behavior inside the shared `RanklandRanklist` wrapper. Extend the existing ranklist full-chain controls utility assertion so the normal ranklist path locks both direct controls children, while existing Live full-chain tests continue covering populated extra-action slot behavior.

**Tech Stack:** Vue 3 SFC, ant-design-vue, Playwright full-chain E2E, Node 24, pnpm 8.

---

### Task 1: RED - capture ranklist empty extra-action wrapper

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add controls direct-child helper output**

Update `getControlsUtilityClasses(page)` so it also reads direct children of `[data-id="rankland-ranklist-controls"]`:

```ts
const controlsChildren = Array.from(controls.children).map((child) => {
  if (!(child instanceof HTMLElement)) {
    return {
      tagName: child.tagName,
      dataId: null,
      classList: [],
      text: child.textContent?.trim() || '',
    };
  }

  return {
    tagName: child.tagName,
    dataId: child.dataset.id || null,
    classList: Array.from(child.classList),
    text: child.textContent?.trim() || '',
  };
});
```

Return it with the existing class data:

```ts
return {
  controlsClasses: Array.from(controls.classList),
  controlsChildren,
  organizationFilterClasses: Array.from(organizationFilter.classList),
  officialWrapperClasses: Array.from(officialWrapper.classList),
  officialTextClasses: Array.from(officialText.classList),
  markerFilterClasses: Array.from(markerFilter.classList),
};
```

- [x] **Step 2: Add expected empty extra-action assertion**

In `renders legacy Ant Design filter controls and preserves filtering behavior`, after the existing `controlsUtilityClasses` creation, add:

```ts
expect(controlsUtilityClasses.controlsChildren).toEqual([
  expect.objectContaining({
    tagName: 'DIV',
    dataId: 'rankland-ranklist-filters',
  }),
  {
    tagName: 'DIV',
    dataId: 'rankland-ranklist-extra-action',
    classList: [],
    text: '',
  },
]);
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls"
```

Expected: FAIL because current Vue omits `[data-id="rankland-ranklist-extra-action"]` on normal ranklist routes without an extra-action slot.

Observed: FAIL. The focused ranklist full-chain test saw only the filters child under `[data-id="rankland-ranklist-controls"]`; the expected empty `DIV[data-id="rankland-ranklist-extra-action"]` was missing.

### Task 2: GREEN - render empty extra-action wrapper

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Always render the extra-action wrapper inside visible controls**

Change:

```vue
<div v-if="hasExtraAction" data-id="rankland-ranklist-extra-action">
  <slot name="extra-action" :ranklist="ranklist" />
</div>
```

to:

```vue
<div data-id="rankland-ranklist-extra-action">
  <slot v-if="hasExtraAction" name="extra-action" :ranklist="ranklist" />
</div>
```

Do not change the controls root `v-if="showFilter || hasExtraAction"` in this slice.

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls"
```

Expected: PASS with the new empty wrapper assertion and existing filter behavior checks.

Observed: PASS. The focused ranklist full-chain test verifies the empty `DIV[data-id="rankland-ranklist-extra-action"]` under controls while preserving existing Ant Design filter controls and filtering behavior.

### Task 3: Migration docs, full gate, commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Update migration docs**

Record this slice as `SRK controls empty extra-action DOM parity`, including:

- old React always-present right-side controls `div` evidence;
- focused RED/GREEN evidence;
- full gate evidence after it runs.

Observed: docs now record `SRK controls empty extra-action DOM parity`, focused RED/GREEN evidence, old React always-present right-side controls `DIV` behavior, and full gate as pending until the fresh slice gate completes.

- [x] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS with Node 24, pnpm 8, generated client routes, migration tests, and whitespace check.

Observed: PASS with Node `v24.11.1`, pnpm `8.15.9`, `gen:client-router` generated 6 client routes, `test:migration` passed with build, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 60 passed / 1 skipped full-chain Playwright tests; `git diff --check` passed.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-srk-controls-empty-extra-action-dom-parity-design.md docs/superpowers/plans/2026-05-28-srk-controls-empty-extra-action-dom-parity.md
git commit -m "fix: 还原 SRK controls 空操作容器"
```

Observed: committed current slice as `fix: 还原 SRK controls 空操作容器`; this plan was then updated and amended into the same slice commit.

- [x] **Step 4: Run post-checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
ps -ax -o pid,command | rg 'playwright|vite|tsx|node.*rankland|mock-api|full-chain|9232|3100|3101'
```

Expected: clean branch status, no whitespace errors, and no lingering Playwright/Vite/mock full-chain server.

Observed: post-checks passed. Branch status was clean, `git show --check --oneline HEAD` and `git diff --check` reported no whitespace errors. The process scan showed no lingering Playwright, Vite, mock API, or full-chain server; only editor TypeScript server processes, a Chrome renderer false-positive numeric match, and the scan command itself matched the broad pattern.
