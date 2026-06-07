# User Modal Photo Wrapper Product Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Vue-only `rankland-user-modal-photo` class from the user modal photo/slogan wrapper and keep the old React exact `mt-4` wrapper behavior.

**Architecture:** Keep the existing shared Vue SRK user modal structure and child `data-id` hooks. Use full-chain tests to locate the old wrapper through `.user-modal > div.mt-4` and photo/slogan parent relationships, then retarget scoped CSS away from the migrated class.

**Tech Stack:** Vue 3 SFC, scoped LESS, Playwright full-chain E2E, RankLand migration docs.

---

## Files

- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Create: `docs/superpowers/specs/2026-05-28-user-modal-photo-wrapper-product-class-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-28-user-modal-photo-wrapper-product-class-parity.md`

## Tasks

- [x] Create the design spec and implementation plan.
- [x] Add RED full-chain assertions for the exact photo/slogan wrapper class list.
- [x] Run focused Ranklist full-chain test and confirm expected failure.
- [x] Remove Vue-only wrapper class and retarget scoped CSS.
- [x] Run focused GREEN test and the full Ranklist full-chain file.
- [x] Update migration docs with verification evidence.
- [x] Run full migration gate and `git diff --check`.
- [x] Commit as `fix: 还原用户弹窗照片容器根类名`.

## Step Details

1. Update Ranklist full-chain assertions:

```ts
const photoWrapper = photo.locator('xpath=..');
await expect(photoWrapper).toHaveClass(/^mt-4$/);
expect(await photoWrapper.evaluate((element) => Array.from(element.classList))).not.toContain(
  'rankland-user-modal-photo',
);
```

```ts
expect(
  await userModal.evaluate((modal) => {
    const photoElement = modal.querySelector('[data-id="rankland-user-modal-photo"]');
    const sloganElement = modal.querySelector('[data-id="rankland-user-modal-slogan"]');
    return (
      photoElement?.parentElement === sloganElement?.parentElement &&
      sloganElement?.parentElement?.className === 'mt-4'
    );
  }),
).toBe(true);
```

```ts
const betaPhotoWrapper = userModal.locator('.user-modal > div.mt-4').filter({
  hasNot: userModal.locator('[data-id="rankland-rank-time-panel"]'),
});
await expect(betaPhotoWrapper).toHaveCount(1);
await expect(betaPhotoWrapper).toHaveClass(/^mt-4$/);
```

Expected RED: focused Ranklist full-chain test fails because the current Vue wrapper emits `rankland-user-modal-photo mt-4`.

Observed RED: focused Ranklist full-chain test failed at the photo wrapper class assertion because the wrapper still emitted `rankland-user-modal-photo mt-4` instead of exact `mt-4`.

Observed GREEN: focused Ranklist full-chain test passed with `1 passed`; the full Ranklist full-chain file passed with `9 passed`.

Observed full gate: Node `v24.11.1`, pnpm `8.15.9`, `gen:client-router` generated 6 client routes, `test:migration` passed with build, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 60 passed / 1 skipped full-chain Playwright tests; `git diff --check` passed.

2. Implement minimal Vue/template and style changes:

```vue
<div class="mt-4">
```

```less
[data-id='rankland-ranklist-user-modal'] .user-modal > .mt-4 img {
  max-width: 100%;
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

Commit only the Vue SRK wrapper, Ranklist full-chain test, this spec/plan, and migration documentation for the user modal photo wrapper product-class parity slice.
