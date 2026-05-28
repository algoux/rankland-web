# User Modal Rank-Time Panel Product Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Vue-only class from the user modal rank-time panel while preserving the old React exact `mt-4` wrapper class and chart-only G2 behavior.

**Architecture:** Keep the shared Vue SRK user modal, `RanklandRankTimeChart`, and stable `data-id` selector. Add full-chain RED assertions for the exact rank-time panel class list, then retarget scoped styles to `data-id` plus the old `mt-4` class.

**Tech Stack:** Vue 3 SFC, scoped LESS, Playwright full-chain E2E, RankLand migration docs.

---

## Files

- Modify: `tests/e2e/full-chain/live.spec.ts`
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Create: `docs/superpowers/specs/2026-05-28-user-modal-rank-time-panel-product-class-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-28-user-modal-rank-time-panel-product-class-parity.md`

## Tasks

- [x] Create the design spec and implementation plan.
- [x] Add RED full-chain assertions for the exact rank-time panel class list.
- [x] Run focused Live full-chain test and confirm expected failure.
- [x] Remove Vue-only rank-time panel product class and retarget scoped CSS.
- [x] Run focused GREEN test and the full Live full-chain file.
- [x] Update migration docs with verification evidence.
- [x] Run full migration gate and `git diff --check`.
- [x] Commit as `fix: 还原用户排名曲线外壳类名`.

## Step Details

1. Update Live full-chain assertions:

```ts
const rankTimePanel = userModal.locator('[data-id="rankland-rank-time-panel"]');
await expect(rankTimePanel).toBeVisible();
await expect(rankTimePanel).toHaveClass(/^mt-4$/);
expect(await rankTimePanel.evaluate((element) => Array.from(element.classList))).not.toContain(
  'rankland-rank-time-panel',
);
```

Expected RED: focused Live full-chain test fails because current Vue still emits `rankland-rank-time-panel mt-4`.

Observed RED: focused Live full-chain test failed because `[data-id="rankland-rank-time-panel"]` still reported `rankland-rank-time-panel mt-4` instead of exact old React `mt-4`.

Observed GREEN: the focused Live full-chain test passed with `1 passed`; the full Live full-chain file passed with `11 passed`.

Observed full gate: Node `v24.11.1`, pnpm `8.15.9`, `gen:client-router` generated 6 client routes, `test:migration` passed with build, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 60 passed / 1 skipped full-chain Playwright tests; `git diff --check` passed.

2. Implement minimal Vue/template and style changes:

```vue
<div
  v-if="activeUserRankTimeData"
  data-id="rankland-rank-time-panel"
  class="mt-4"
>
```

```less
[data-id='rankland-rank-time-panel'].mt-4 {
  margin-top: 16px;
}
```

3. Verification commands:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page, preserves queries, polls live ranklist, and guards WebSocket setup"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts
node -v
corepack pnpm -v
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

4. Commit boundary:

Commit only the Vue SRK wrapper, Live full-chain test, this spec/plan, and migration documentation for the user modal rank-time panel product-class parity slice.
