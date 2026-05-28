# User Modal Slogan Product Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Vue-only class from the user modal slogan while preserving old React exact `slogan mt-4 mb-2` classes and visual styling.

**Architecture:** Keep the shared Vue SRK user modal and stable `data-id` selector. Add full-chain RED assertions for the exact slogan class list, then retarget scoped styles to `data-id` plus the old product class.

**Tech Stack:** Vue 3 SFC, scoped LESS, Playwright full-chain E2E, RankLand migration docs.

---

## Files

- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Create: `docs/superpowers/specs/2026-05-28-user-modal-slogan-product-class-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-28-user-modal-slogan-product-class-parity.md`

## Tasks

- [x] Create the design spec and implementation plan.
- [x] Add RED full-chain assertions for the exact slogan class list.
- [x] Run focused Ranklist full-chain test and confirm expected failure.
- [x] Remove Vue-only slogan product class and retarget scoped CSS.
- [x] Run focused GREEN test and the full Ranklist full-chain file.
- [x] Update migration docs with verification evidence.
- [x] Run full migration gate and `git diff --check`.
- [x] Commit as `fix: 还原用户标语类名`.

## Step Details

1. Update Ranklist full-chain assertions:

```ts
const slogan = userModal.locator('[data-id="rankland-user-modal-slogan"]');
await expect(slogan).toHaveText('Keep moving forward');
await expect(slogan).toHaveClass(/^slogan mt-4 mb-2$/);
expect(await slogan.evaluate((element) => Array.from(element.classList))).not.toContain(
  'rankland-user-modal-slogan',
);
```

Expected RED: focused Ranklist full-chain test fails because current Vue still emits `rankland-user-modal-slogan slogan mt-4 mb-2`.

Observed RED: focused Ranklist full-chain test failed because `[data-id="rankland-user-modal-slogan"]` still reported `rankland-user-modal-slogan slogan mt-4 mb-2` instead of exact old React `slogan mt-4 mb-2`.

Observed GREEN: the focused Ranklist full-chain test passed with `1 passed`; the full Ranklist full-chain file passed with `9 passed`.

Observed full gate: Node `v24.11.1`, pnpm `8.15.9`, `gen:client-router` generated 6 client routes, `test:migration` passed with build, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 60 passed / 1 skipped full-chain Playwright tests; `git diff --check` passed.

2. Implement minimal Vue/template and style changes:

```vue
<p
  v-if="activeUserSlogan"
  data-id="rankland-user-modal-slogan"
  class="slogan mt-4 mb-2"
>
```

```less
[data-id='rankland-user-modal-slogan'].slogan {
  margin: 16px 0 8px;
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 32px;
  text-align: center;
}

[data-id='rankland-user-modal-slogan'].slogan::before {
  display: block;
  font-size: 14px;
  content: 'SLOGAN';
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

Commit only the Vue SRK wrapper, Ranklist full-chain test, this spec/plan, and migration documentation for the user modal slogan product-class parity slice.
