# Ranklist Filter Control Inner Gap Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React SRK filter-control inner spacing by removing Vue-only wrapper gaps.

**Architecture:** Keep the shared Vue ranklist wrapper and full-chain ranklist harness. Extend the existing filter-controls test to measure actual rendered gaps, then remove only the wrapper `gap` declarations that double-count old utility spacing.

**Tech Stack:** Vue 3 SFC, scoped LESS, Ant Design Vue controls, Playwright full-chain E2E, bwcx/vite-ssr route harness.

---

### Task 1: RED - Capture Inner Gap Contract

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add an inner-gap helper**

Add a helper near existing filter helpers that returns:

- organization wrapper computed column gap;
- checkbox wrapper computed column gap;
- rounded pixel distance from the `筛选` span to the organization Select;
- rounded pixel distance from the `仅正式参赛` span to the Switch.

- [x] **Step 2: Assert old actual gaps**

In `renders legacy Ant Design filter controls and preserves filtering behavior`, after existing desktop spacing assertions, assert:

- organization wrapper column gap is `normal`;
- checkbox wrapper column gap is `normal`;
- organization text-to-Select visual gap is `8`;
- official text-to-Switch visual gap is `4`.

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls and preserves filtering behavior"
```

Expected: FAIL because current Vue adds wrapper gaps on top of old `ml-2` / `mr-1` spacing.

Observed: FAIL because current Vue reported `organizationFilterColumnGap: "8px"` and `checkboxColumnGap: "4px"`.

### Task 2: GREEN - Remove Vue-Only Wrapper Gaps

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Remove generic filter gap**

Change `.rankland-ranklist-filter` so it no longer declares `gap: 8px`.

- [x] **Step 2: Remove checkbox wrapper gap**

Change `.rankland-ranklist-checkbox` so it no longer declares `gap: 4px`; keep `margin-left: 20px`.

- [x] **Step 3: Add local old utility spacing**

Add local rules for `.rankland-ranklist-select.ml-2 { margin-left: 8px; }` and `.rankland-ranklist-checkbox .mr-1 { margin-right: 4px; }`, because after removing Vue-only wrapper gaps the old utility class tokens need local CSS in this component.

- [x] **Step 4: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls and preserves filtering behavior"
```

Expected: PASS.

Observed: PASS with 1 focused ranklist filter-controls test.

- [x] **Step 5: Run ranklist full-chain regression**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: PASS, including mobile controls layout and viewport-bound checks.

Observed: PASS with 9 ranklist full-chain tests.

### Task 3: Document, Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/superpowers/plans/2026-05-28-ranklist-filter-control-inner-gap-parity.md`

- [x] **Step 1: Update migration docs**

Record:

- slice name: `Ranklist filter control inner gap parity`;
- RED evidence for doubled Vue-only wrapper gaps;
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
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-ranklist-filter-control-inner-gap-parity-design.md docs/superpowers/plans/2026-05-28-ranklist-filter-control-inner-gap-parity.md
git diff --cached --check
git commit -m "fix: 还原榜单筛选控件内部间距"
```

- [ ] **Step 4: Run post-commit checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean branch status, HEAD patch check passes, and no whitespace errors.
