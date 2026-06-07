# User Modal Marker Label Product Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Vue-only class from user modal marker labels while preserving the old React `user-modal-info-marker` class, SRK preset class, and marker styling.

**Architecture:** Keep the shared Vue SRK user modal and stable `data-id` selector. Add full-chain RED assertions for the exact marker label class list, then retarget scoped styles to `data-id` plus the old product class.

**Tech Stack:** Vue 3 SFC, scoped LESS, Playwright full-chain E2E, RankLand migration docs.

---

## Files

- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Create: `docs/superpowers/specs/2026-05-28-user-modal-marker-label-product-class-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-28-user-modal-marker-label-product-class-parity.md`

## Tasks

- [x] Create the design spec and implementation plan.
- [x] Add RED full-chain assertions for the exact marker label class list.
- [x] Run focused Ranklist full-chain test and confirm expected failure.
- [x] Remove Vue-only marker label product class and retarget scoped CSS.
- [x] Run focused GREEN test and the full Ranklist full-chain file.
- [x] Update migration docs with verification evidence.
- [x] Run full migration gate and `git diff --check`.
- [x] Commit as `fix: 还原用户标记标签类名`.

## Step Details

1. Update Ranklist full-chain assertions:

```ts
const marker = userModal.locator('[data-id="rankland-user-modal-marker"]').first();
await expect(marker).toHaveText('Gold Group');
await expect(marker).toHaveClass(/^user-modal-info-marker srk-preset-marker-yellow$/);
expect(await marker.evaluate((element) => Array.from(element.classList))).not.toContain(
  'rankland-user-modal-marker',
);
```

Expected RED: focused Ranklist full-chain test fails because current Vue still emits `rankland-user-modal-marker user-modal-info-marker srk-preset-marker-yellow`.

Observed RED: focused Ranklist full-chain test failed because `[data-id="rankland-user-modal-marker"]` still reported `rankland-user-modal-marker user-modal-info-marker srk-preset-marker-yellow` instead of exact old React `user-modal-info-marker srk-preset-marker-yellow`.

Observed GREEN: the focused Ranklist full-chain test passed with `1 passed`; the full Ranklist full-chain file passed with `9 passed`.

Observed full gate: Node `v24.11.1`, pnpm `8.15.9`, `gen:client-router` generated 6 client routes, `test:migration` passed with build, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 60 passed / 1 skipped full-chain Playwright tests; `git diff --check` passed.

2. Implement minimal Vue/template and style changes:

```vue
<span
  v-for="marker in activeUserMarkerLabels"
  :key="marker.id"
  data-id="rankland-user-modal-marker"
  class="user-modal-info-marker"
  :class="marker.className"
  :style="marker.style"
>
```

```less
[data-id='rankland-user-modal-marker'].user-modal-info-marker {
  display: inline-block;
  padding: 2px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 12px;
}

[data-id='rankland-user-modal-marker'].user-modal-info-marker:not(:last-of-type) {
  margin-right: 4px;
}
```

3. Verification commands:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
node -v
corepack pnpm -v
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

4. Commit boundary:

Commit only the Vue SRK wrapper, Ranklist full-chain test, this spec/plan, and migration documentation for the user modal marker label product-class parity slice.
