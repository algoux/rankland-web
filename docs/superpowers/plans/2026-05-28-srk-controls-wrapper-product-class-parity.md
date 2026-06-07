# SRK Controls Wrapper Product Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Vue-only `.rankland-ranklist-controls` product class from the SRK controls root while preserving old React utility classes and layout behavior.

**Architecture:** Keep the shared Vue ranklist wrapper and stable `data-id` selector. Add full-chain RED assertions for the exact old controls root class list, then retarget scoped styles from the product class to the `data-id` plus utility-class selector.

**Tech Stack:** Vue 3 SFC, scoped LESS, Playwright full-chain E2E, RankLand migration docs.

---

## Files

- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `tests/e2e/full-chain/live.spec.ts`
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Create: `docs/superpowers/specs/2026-05-28-srk-controls-wrapper-product-class-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-28-srk-controls-wrapper-product-class-parity.md`

## Tasks

- [x] Create the design spec and implementation plan.
- [x] Add RED full-chain assertions for the exact controls root class list.
- [x] Run focused Ranklist/Live full-chain tests and confirm expected failure.
- [x] Remove the Vue-only controls root product class.
- [x] Run focused GREEN tests and the full Ranklist/Live full-chain files.
- [x] Update migration docs with verification evidence.
- [x] Run full migration gate and `git diff --check`.
- [x] Commit as `fix: 还原 SRK 控制栏外壳类名`.

## Step Details

1. Update full-chain assertions:

```ts
expect(await getRanklistRendererTopLevelDom(page)).toEqual([
  // ...
  {
    tagName: 'DIV',
    dataId: 'rankland-ranklist-controls',
    classList: ['mt-3', 'mx-4', 'flex', 'justify-between', 'items-center'],
  },
  // ...
]);

expect(controlsUtilityClasses.controlsClasses).toEqual([
  'mt-3',
  'mx-4',
  'flex',
  'justify-between',
  'items-center',
]);
expect(controlsUtilityClasses.controlsClasses).not.toContain('rankland-ranklist-controls');
```

Expected RED: focused Ranklist/Live full-chain tests fail because current Vue still emits `rankland-ranklist-controls`.

Observed RED: the focused Ranklist full-chain test failed because the controls root still reported `["rankland-ranklist-controls", "mt-3", "mx-4", "flex", "justify-between", "items-center"]`; the focused Live full-chain test failed for the same extra Vue-only class. A parallel GREEN attempt also exposed a transient full-chain mock port conflict, and `lsof` / process inspection confirmed port `3101` was released before rerunning Live sequentially.

2. Implement minimal Vue/template and style changes:

```vue
<div
  v-if="showFilter || hasExtraAction"
  data-id="rankland-ranklist-controls"
  class="mt-3 mx-4 flex justify-between items-center"
>
```

```less
[data-id='rankland-ranklist-controls'].mt-3.mx-4.flex.justify-between.items-center {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 16px 0;
}
```

Observed GREEN: the focused Ranklist test passed with `1 passed`; the focused Live test passed with `1 passed`; the combined Ranklist/Live full-chain run passed with `20 passed`.

Observed full gate: `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check` passed with Node `v24.11.1`, pnpm `8.15.9`, 6 generated client routes, build pass, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, 60 passed / 1 skipped full-chain Playwright tests, and `git diff --check` pass.

3. Verification commands:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page, preserves queries, polls live ranklist, and guards WebSocket setup"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

4. Commit boundary:

Commit only the Vue SRK wrapper, Ranklist/Live full-chain tests, this spec/plan, and migration documentation for the SRK controls wrapper product-class parity slice.
