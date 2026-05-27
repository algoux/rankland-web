# Ranklist Official Filter Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Vue-only `.rankland-ranklist-checkbox` product class from the SRK official-only wrapper while preserving old React `ml-5 inline-flex items-center` behavior.

**Architecture:** Keep the shared Vue ranklist wrapper, stable official Switch `data-id`, and existing full-chain ranklist filter-controls test. Assert the old official wrapper class contract first, then move official wrapper styling from the product class selector to local utility-shape selectors.

**Tech Stack:** Vue 3 SFC, scoped LESS, Ant Design Vue Switch, Playwright full-chain E2E, bwcx/vite-ssr route harness.

---

### Task 1: RED - Capture Official Wrapper Contract

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Stop helper dependence on Vue-only class**

Resolve the official wrapper as `officialFilter.parentElement` in filter spacing, inner gap, DOM parity, mobile layout, and utility-class helpers.

- [x] **Step 2: Assert old official wrapper class contract**

In `renders legacy Ant Design filter controls and preserves filtering behavior`, assert:

- official wrapper classes contain `ml-5`, `inline-flex`, and `items-center`;
- official wrapper classes do not contain `rankland-ranklist-checkbox`;
- existing computed spacing, mobile layout, direct child DOM, and official-only filtering behavior remain asserted.

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls and preserves filtering behavior"
```

Expected: FAIL because current Vue still renders `.rankland-ranklist-checkbox`.

Observed: FAIL as expected. Playwright reported `Expected value: not "rankland-ranklist-checkbox"` with received class list `["rankland-ranklist-checkbox", "ml-5", "inline-flex", "items-center"]`.

### Task 2: GREEN - Remove Vue-Only Official Class

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Remove official wrapper product class**

Change the official wrapper to:

```vue
<span class="ml-5 inline-flex items-center">
```

- [x] **Step 2: Preserve official spacing with old utility-shape selectors**

Replace `.rankland-ranklist-checkbox` style rules with selectors matching the old wrapper shape:

```less
span.ml-5.inline-flex.items-center {
  display: inline-flex;
  align-items: center;
  margin-left: 20px;
}

span.ml-5.inline-flex.items-center .mr-1 {
  margin-right: 4px;
}
```

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls and preserves filtering behavior"
```

Expected: PASS.

Observed: PASS, `1 passed (8.3s)`.

- [x] **Step 4: Run ranklist full-chain regression**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: PASS, including official-only filtering and mobile layout checks.

Observed: PASS, `9 passed (26.4s)`.

### Task 3: Document, Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/superpowers/plans/2026-05-28-ranklist-official-filter-class-parity.md`

- [x] **Step 1: Update migration docs**

Record:

- slice name: `Ranklist official filter class parity`;
- RED evidence for the Vue-only official wrapper class;
- GREEN evidence for focused ranklist filter-controls test;
- ranklist full-chain regression and full gate evidence.

Observed: migration status, final integration review, and manual acceptance checklist now record the official filter class parity RED/GREEN and ranklist regression evidence, with full gate marked pending until the fresh gate run completes.

- [x] **Step 2: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, generated client routes, build/unit/SSR/shallow/full-chain migration tests green, and no whitespace errors.

Observed: PASS. `node -v` returned `v24.11.1`; `corepack pnpm -v` returned `8.15.9`; `gen:client-router` generated 8 client routes; `test:migration` passed build, 35 unit files / 152 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 60 passed / 1 skipped full-chain Playwright tests; `git diff --check` passed.

- [x] **Step 3: Commit the completed slice**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-ranklist-official-filter-class-parity-design.md docs/superpowers/plans/2026-05-28-ranklist-official-filter-class-parity.md
git diff --cached --check
git commit -m "fix: 还原榜单正式筛选类名"
```

Observed: prepared for commit after focused ranklist re-check passed and `git diff --check` passed.
