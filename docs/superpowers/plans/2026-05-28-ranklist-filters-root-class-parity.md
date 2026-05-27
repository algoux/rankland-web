# Ranklist Filters Root Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Vue-only `.rankland-ranklist-filters` product class from the SRK filters root while preserving layout and behavior.

**Architecture:** Keep the existing Vue ranklist component, stable `data-id` hook, and full-chain ranklist test harness. Assert the root class contract in the existing filter-controls product test, then move styling from the product class selector to the `data-id` selector.

**Tech Stack:** Vue 3 SFC, scoped LESS, Ant Design Vue controls, Playwright full-chain E2E, bwcx/vite-ssr route harness.

---

### Task 1: RED - Capture Root Class Contract

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Extend DOM parity helper**

Return `filtersClasses: Array.from(filters.classList)` from `getFilterControlDomParity`.

- [x] **Step 2: Assert old React plain root**

In `renders legacy Ant Design filter controls and preserves filtering behavior`, assert:

- `filtersClasses` is an empty array;
- existing direct child sequence, parent data-id checks, wrapper classes, spacing, and behavior remain asserted.

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls and preserves filtering behavior"
```

Expected: FAIL because current Vue still renders `.rankland-ranklist-filters` on the filters root.

Observed: FAIL because current Vue reported `filtersClasses: ["rankland-ranklist-filters"]` while the old React plain-root expectation is `[]`.

### Task 2: GREEN - Remove Vue-Only Root Class

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Remove root class**

Remove `class="rankland-ranklist-filters"` from `[data-id="rankland-ranklist-filters"]`.

- [x] **Step 2: Preserve layout through data-id style**

Replace the `.rankland-ranklist-filters` style selector with `[data-id='rankland-ranklist-filters']` and keep:

- `display: flex`;
- `flex-wrap: wrap`;
- `align-items: center`;
- `gap: 0`.

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls and preserves filtering behavior"
```

Expected: PASS.

Observed: PASS with 1 focused ranklist filter-controls test.

- [x] **Step 4: Run ranklist full-chain regression**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: PASS, including spacing and mobile layout checks.

Observed: PASS with 9 ranklist full-chain tests.

### Task 3: Document, Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/superpowers/plans/2026-05-28-ranklist-filters-root-class-parity.md`

- [x] **Step 1: Update migration docs**

Record:

- slice name: `Ranklist filters root class parity`;
- RED evidence for the Vue-only class;
- GREEN evidence for focused ranklist filter-controls test;
- ranklist full-chain regression and full gate evidence.

- [x] **Step 2: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, generated client routes, build/unit/SSR/shallow/full-chain migration tests green, and no whitespace errors.

Observed: PASS with Node `v24.11.1`, pnpm `8.15.9`, generated 8 client routes, build success, 35 unit files / 152 unit tests, 1 SSR smoke test, 1 shallow Playwright test, 60 passed / 1 skipped default full-chain Playwright tests, and no `git diff --check` output.

- [x] **Step 3: Commit the completed slice**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-ranklist-filters-root-class-parity-design.md docs/superpowers/plans/2026-05-28-ranklist-filters-root-class-parity.md
git diff --cached --check
git commit -m "fix: 还原榜单筛选根节点类名"
```
