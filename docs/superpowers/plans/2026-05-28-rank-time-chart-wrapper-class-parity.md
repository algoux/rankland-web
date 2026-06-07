# Rank-Time Chart Wrapper Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Vue-only product classes from the rank-time chart wrapper and G2 container while preserving chart behavior and migration probes.

**Architecture:** The DOM parity change is limited to `RanklandRankTimeChart`. The full-chain live test owns the modal/chart integration assertion because that route already exercises rank-time chart rendering through the SRK user modal.

**Tech Stack:** Vue 3 SFC, scoped Less, Playwright full-chain E2E, pnpm migration gates.

---

### Task 1: Lock Wrapper Class Parity With A Failing Test

**Files:**
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [x] **Step 1: Write the failing test**

Add class-absence and layout assertions after the existing `rankTimeChart` metadata checks:

```ts
    const rankTimeCurve = userModal.locator('[data-id="rankland-rank-time-curve"]');
    await expect(rankTimeCurve).toBeVisible();
    expect((await rankTimeCurve.getAttribute('class')) || '').toBe('');
    expect((await rankTimeChart.getAttribute('class')) || '').toBe('');
    expect(
      await rankTimeCurve.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          display: style.display,
          height: style.height,
          position: style.position,
          width: style.width,
        };
      }),
    ).toMatchObject({
      display: 'block',
      height: '400px',
      position: 'relative',
    });
    expect(
      await rankTimeChart.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          height: style.height,
          width: style.width,
        };
      }),
    ).toMatchObject({
      height: '400px',
    });
```

- [x] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page"
```

Actual: FAIL because the current Vue chart wrapper still rendered `class="rankland-rank-time-curve"`.

### Task 2: Remove Vue-Only Wrapper Classes

**Files:**
- Modify: `src/client/components/rankland-rank-time-chart.vue`

- [x] **Step 1: Remove production-only class attributes**

Change the template to remove `class="rankland-rank-time-curve"` and `class="rankland-rank-time-g2-chart"` while leaving `data-id`, `data-chart-*`, and inline height bindings intact.

- [x] **Step 2: Retarget scoped layout CSS**

Replace the two product-class selectors with `data-id` selectors:

```less
[data-id='rankland-rank-time-curve'] {
  position: relative;
  width: 100%;
}

[data-id='rankland-rank-time-g2-chart'] {
  width: 100%;
  height: 100%;
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

- [x] **Step 1: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Actual: PASS with Node `v24.11.1`, pnpm `8.15.9`, 6 generated client routes, build, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, 60 passed / 1 skipped full-chain Playwright tests, and `git diff --check`.

- [x] **Step 2: Update migration docs**

Record the slice, focused/full gate evidence, and the known next focus of product-review-driven SRK lower-level table pixel parity or route polish.

- [x] **Step 3: Commit**

Run:

```bash
git add tests/e2e/full-chain/live.spec.ts src/client/components/rankland-rank-time-chart.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-rank-time-chart-wrapper-class-parity-design.md docs/superpowers/plans/2026-05-28-rank-time-chart-wrapper-class-parity.md
git commit -m "fix: 还原排名时间图表容器类名"
```

Actual: committed as `fix: 还原排名时间图表容器类名`.
