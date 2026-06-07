# User Modal Segment Label Product Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Vue-only class from the user modal award-segment label while preserving old React exact `user-modal-segment-label bg-segment-*` classes and visual styling.

**Architecture:** Keep the shared Vue SRK user modal and stable `data-id` selector. Add full-chain RED assertions for the exact segment-label class list and style, then retarget scoped styles to `data-id` plus the old product class.

**Tech Stack:** Vue 3 SFC, scoped LESS, Playwright full-chain E2E, RankLand migration docs.

---

## Files

- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Create: `docs/superpowers/specs/2026-05-28-user-modal-segment-label-product-class-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-28-user-modal-segment-label-product-class-parity.md`

## Tasks

- [x] Create the design spec and implementation plan.
- [x] Add RED full-chain assertions for the exact segment-label class list and style.
- [x] Run focused Ranklist full-chain test and confirm expected failure.
- [x] Remove Vue-only segment-label product class and retarget scoped CSS.
- [x] Run focused GREEN test and the full Ranklist full-chain file.
- [x] Update migration docs with verification evidence.
- [x] Run full migration gate and `git diff --check`.
- [x] Commit as `fix: 还原奖区标签类名`.

## Step Details

1. Update Ranklist full-chain assertions:

```ts
const segmentLabel = userModal.locator('[data-id="rankland-user-modal-segment-label"]');
await expect(segmentLabel).toHaveText('Gold');
await expect(segmentLabel).toHaveClass(/^user-modal-segment-label bg-segment-gold$/);
expect(await segmentLabel.evaluate((element) => Array.from(element.classList))).not.toContain(
  'rankland-user-modal-segment-label',
);
const segmentLabelStyle = await segmentLabel.evaluate((element) => {
  const style = window.getComputedStyle(element);
  return {
    display: style.display,
    paddingTop: style.paddingTop,
    paddingRight: style.paddingRight,
    paddingBottom: style.paddingBottom,
    paddingLeft: style.paddingLeft,
    borderRadius: style.borderRadius,
    color: style.color,
  };
});
expect(segmentLabelStyle).toMatchObject({
  display: 'inline-block',
  paddingTop: '4px',
  paddingRight: '4px',
  paddingBottom: '4px',
  paddingLeft: '4px',
  borderRadius: '4px',
  color: 'rgb(255, 255, 255)',
});
```

Expected RED: focused Ranklist full-chain test fails because current Vue still emits `rankland-user-modal-segment-label user-modal-segment-label bg-segment-gold`.

Observed RED: focused Ranklist full-chain test failed because `[data-id="rankland-user-modal-segment-label"]` still reported `rankland-user-modal-segment-label user-modal-segment-label bg-segment-gold` instead of exact old React `user-modal-segment-label bg-segment-gold`.

Observed GREEN: the focused Ranklist full-chain test passed with `1 passed`; the full Ranklist full-chain file passed with `9 passed`.

Observed full gate: Node `v24.11.1`, pnpm `8.15.9`, `gen:client-router` generated 6 client routes, `test:migration` passed with build, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 60 passed / 1 skipped full-chain Playwright tests; `git diff --check` passed.

2. Implement minimal Vue/template and style changes:

```vue
<span
  data-id="rankland-user-modal-segment-label"
  class="user-modal-segment-label"
  :class="`bg-segment-${activeUserSegment.segmentStyle}`"
>
```

```less
[data-id='rankland-user-modal-segment-label'].user-modal-segment-label {
  display: inline-block;
  padding: 4px;
  border-radius: 4px;
  color: #fff;
}
```

3. Verification commands:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

4. Commit boundary:

Commit only the Vue SRK wrapper, Ranklist full-chain test, this spec/plan, and migration documentation for the user modal segment-label product-class parity slice.
