# Ranklist Mobile Filter Controls Layout Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React mobile filter-controls row layout in the shared SRK ranklist wrapper.

**Architecture:** Keep the existing shared Vue wrapper and full-chain ranklist harness. Extend the existing filter-controls full-chain test to assert the mobile computed layout, then remove only the Vue-only mobile override that changed the controls into a vertical layout.

**Tech Stack:** Vue 3 SFC, scoped LESS, Ant Design Vue controls, Playwright full-chain E2E, bwcx/vite-ssr route harness.

---

### Task 1: RED - Capture Mobile Controls Layout Contract

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add a mobile filter layout helper**

Add a helper near the existing filter helper functions that reads computed styles for:

- controls root `flexDirection` and `alignItems`;
- filters root `flexDirection`, `alignItems`, `rowGap`, and `columnGap`;
- organization select `width`;
- official wrapper `marginLeft`;
- marker filter `marginLeft`.

- [x] **Step 2: Assert old mobile layout in the filter-controls test**

In `renders legacy Ant Design filter controls and preserves filtering behavior`, switch to a 390px viewport after the existing desktop spacing/class assertions, reload the route, and assert:

- controls root remains row/center;
- filters root remains row/center with no 12px gap;
- organization select remains 160px wide;
- official and marker filters keep 20px left margin.

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls and preserves filtering behavior"
```

Expected: FAIL because current Vue mobile CSS forces column layout, 100% select width, and zero left margins.

Observed: FAIL because current Vue reported `controlsFlexDirection: "column"`, `controlsAlignItems: "stretch"`, filter `rowGap` / `columnGap: "12px"`, official and marker margins as `0px`, and organization select width as `324.609px`.

### Task 2: GREEN - Remove Vue-Only Mobile Override

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Remove only the mobile filter-controls override**

Delete the final `@media (max-width: 767px)` block that changes:

- `.rankland-ranklist-controls`;
- `.rankland-ranklist-filters`;
- `.rankland-ranklist-checkbox`;
- `.rankland-ranklist-marker-filter`;
- `.rankland-ranklist-select`.

Keep the separate progress-bar mobile wrapping rule intact because old SRK progress parity is outside this slice.

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls and preserves filtering behavior"
```

Expected: PASS.

Observed: PASS with 1 focused ranklist filter-controls test.

- [x] **Step 3: Run ranklist full-chain regression**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: PASS, including existing desktop/mobile viewport-bound checks.

Observed: PASS with 9 ranklist full-chain tests.

### Task 3: Document, Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/superpowers/plans/2026-05-28-ranklist-mobile-filter-controls-layout-parity.md`

- [x] **Step 1: Update migration docs**

Record:

- slice name: `Ranklist mobile filter controls layout parity`;
- RED evidence for Vue-only mobile column layout;
- GREEN evidence for focused ranklist filter-controls test;
- ranklist full-chain regression and full gate evidence;
- route progress updates for `/ranklist/:id` and the shared SRK wrapper.

- [x] **Step 2: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, generated client routes, build/unit/SSR/shallow/full-chain migration tests green, and no whitespace errors.

Observed: PASS with Node `v24.11.1`, pnpm `8.15.9`, generated 8 client routes, build success, 35 unit files / 152 unit tests, 1 SSR smoke test, 1 shallow Playwright test, 60 passed / 1 skipped default full-chain Playwright tests, and no `git diff --check` output.

- [ ] **Step 3: Commit the completed slice**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-ranklist-mobile-filter-controls-layout-parity-design.md docs/superpowers/plans/2026-05-28-ranklist-mobile-filter-controls-layout-parity.md
git diff --cached --check
git commit -m "fix: 还原榜单移动端筛选布局"
```

- [ ] **Step 4: Run post-commit checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean branch status, HEAD patch check passes, and no whitespace errors.
