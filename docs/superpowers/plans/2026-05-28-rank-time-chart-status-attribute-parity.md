# Rank-Time Chart Status Attribute Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Vue-only `data-chart-status` attribute from the rank-time chart wrapper while preserving existing chart behavior.

**Architecture:** The public DOM assertion belongs in the existing live full-chain scenario that opens the user modal and verifies the rank-time chart. The Vue chart component keeps its internal status state for lifecycle/error handling, but stops reflecting that state into product DOM.

**Tech Stack:** Vue 3 SFC, scoped Less, Playwright full-chain E2E, pnpm migration gates.

---

### Task 1: Lock Status Attribute Omission With A Failing Test

**Files:**
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [x] **Step 1: Write the failing test**

Add this assertion immediately after `rankTimeCurve` is visible and classless:

```ts
    expect(await rankTimeCurve.getAttribute('data-chart-status')).toBeNull();
```

- [x] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page"
```

Actual: FAIL because the current Vue chart wrapper rendered `data-chart-status="loading"` while the chart was initializing.

### Task 2: Remove Status Attribute And Stale CSS

**Files:**
- Modify: `src/client/components/rankland-rank-time-chart.vue`
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Remove the status attribute binding**

Change the outer chart wrapper from:

```vue
<div
  data-id="rankland-rank-time-curve"
  :data-chart-status="chartStatus"
  :style="{ height: `${chartModel.containerHeight}px` }"
>
```

to:

```vue
<div
  data-id="rankland-rank-time-curve"
  :style="{ height: `${chartModel.containerHeight}px` }"
>
```

Keep `chartStatus` state and the error span behavior unchanged.

- [x] **Step 2: Remove stale shared ranklist CSS**

Delete this unused rule from `src/client/components/rankland-ranklist.vue`:

```less
.rankland-rank-time-curve {
  display: block;
  width: 100%;
}
```

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page"
```

Actual: PASS.

### Task 3: Update Migration Records And Gate

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-28-rank-time-chart-status-attribute-parity.md`

- [x] **Step 1: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Actual: PASS with Node `v24.11.1`, pnpm `8.15.9`, 6 generated client routes, build, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, 60 passed / 1 skipped full-chain Playwright tests, and `git diff --check`.

- [x] **Step 2: Update migration docs**

Record the slice name, focused RED/GREEN evidence, full gate evidence, and the remaining next focus of product-review-driven SRK lower-level table pixel parity or route polish.

- [x] **Step 3: Commit**

Run:

```bash
git add tests/e2e/full-chain/live.spec.ts src/client/components/rankland-rank-time-chart.vue src/client/components/rankland-ranklist.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-rank-time-chart-status-attribute-parity-design.md docs/superpowers/plans/2026-05-28-rank-time-chart-status-attribute-parity.md
git commit -m "fix: 还原排名时间图表状态属性"
```

Actual: committed as `fix: 还原排名时间图表状态属性`.
