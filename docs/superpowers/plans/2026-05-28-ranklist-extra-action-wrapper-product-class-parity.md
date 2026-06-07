# Ranklist Extra Action Wrapper Product Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Vue-only `rankland-ranklist-extra-action` class from the SRK controls extra-action wrapper while preserving the old React plain-wrapper behavior.

**Architecture:** Keep the shared Vue `RanklandRanklist` slot wrapper and stable `data-id` hook. Add Live full-chain RED assertions for the wrapper class list, then remove only the template class because spacing was already moved to product-neutral controls/live-toggle rules in earlier slices.

**Tech Stack:** Vue 3 SFC, Playwright full-chain E2E, RankLand migration docs.

---

## Files

- Modify: `tests/e2e/full-chain/live.spec.ts`
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Create: `docs/superpowers/specs/2026-05-28-ranklist-extra-action-wrapper-product-class-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-28-ranklist-extra-action-wrapper-product-class-parity.md`

## Tasks

- [x] Create the design spec and implementation plan.
- [x] Add RED Live full-chain assertions for the extra-action wrapper class list.
- [x] Run focused Live full-chain test and confirm expected failure.
- [x] Remove Vue-only extra-action wrapper class.
- [x] Run focused GREEN test.
- [x] Update migration docs with verification evidence.
- [x] Run full migration gate and `git diff --check`.
- [x] Commit as `fix: 还原 SRK 额外操作容器类名`.

## Step Details

1. Update the Live controls helper:

```ts
return {
  controlsClasses: Array.from(controls.classList),
  extraActionClasses: Array.from(extraAction.classList),
  extraActionDisplay: extraActionStyle.display,
  extraActionColumnGap: extraActionStyle.columnGap,
  extraActionRowGap: extraActionStyle.rowGap,
  // existing live-toggle fields stay unchanged
};
```

Add assertions:

```ts
expect(await getLiveControlsChrome(page)).toMatchObject({
  extraActionClasses: [],
  extraActionDisplay: 'block',
  extraActionColumnGap: 'normal',
  extraActionRowGap: 'normal',
});
```

Expected RED: focused Live full-chain test fails because the current wrapper still emits `rankland-ranklist-extra-action`.

Observed RED: focused Live full-chain test failed because `extraActionClasses` was `["rankland-ranklist-extra-action"]` instead of an empty array.

Observed GREEN: focused Live full-chain test passed with `1 passed`; the full Live full-chain file passed with `11 passed`.

Observed full gate: Node `v24.11.1`, pnpm `8.15.9`, `gen:client-router` generated 6 client routes, `test:migration` passed with build, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 60 passed / 1 skipped full-chain Playwright tests; `git diff --check` passed.

2. Implement minimal Vue template change:

```vue
<div v-if="hasExtraAction" data-id="rankland-ranklist-extra-action">
  <slot name="extra-action" :ranklist="ranklist" />
</div>
```

3. Verification commands:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page, preserves queries, polls live ranklist, and guards WebSocket setup"
node -v
corepack pnpm -v
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

4. Commit boundary:

Commit only the Vue SRK wrapper, Live full-chain test, this spec/plan, and migration documentation for the extra-action wrapper product-class parity slice.
