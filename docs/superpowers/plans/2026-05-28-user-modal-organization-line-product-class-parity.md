# User Modal Organization Line Product Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Vue-only product classes from the user modal organization line while preserving old React exact `mb-0` class and zero-margin behavior.

**Architecture:** Keep the shared Vue SRK user modal and stable `data-id` selector. Add full-chain RED assertions for the exact organization line class list, then retarget scoped organization-line styles to `data-id` plus the old utility class.

**Tech Stack:** Vue 3 SFC, scoped LESS, Playwright full-chain E2E, RankLand migration docs.

---

## Files

- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Create: `docs/superpowers/specs/2026-05-28-user-modal-organization-line-product-class-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-28-user-modal-organization-line-product-class-parity.md`

## Tasks

- [x] Create the design spec and implementation plan.
- [x] Add RED full-chain assertions for the exact organization line class list.
- [x] Run focused Ranklist full-chain test and confirm expected failure.
- [x] Remove Vue-only organization line product classes.
- [x] Run focused GREEN test and the full Ranklist full-chain file.
- [x] Update migration docs with verification evidence.
- [x] Run full migration gate and `git diff --check`.
- [x] Commit as `fix: 还原用户组织行类名`.

## Step Details

1. Update Ranklist full-chain assertions:

```ts
await expect(organizationLine).toHaveClass(/^mb-0$/);
expect(await organizationLine.evaluate((element) => Array.from(element.classList))).not.toContain(
  'rankland-user-modal-organization',
);
```

Expected RED: focused Ranklist full-chain test fails because current Vue still emits `rankland-user-modal-line rankland-user-modal-organization mb-0`.

Observed RED: the focused Ranklist full-chain test failed because `[data-id="rankland-user-modal-organization"]` still reported `rankland-user-modal-line rankland-user-modal-organization mb-0` instead of exact old React `mb-0`.

Observed GREEN: the focused Ranklist full-chain test passed with `1 passed`; the full Ranklist full-chain file passed with `9 passed`.

Observed full gate: Node `v24.11.1`, pnpm `8.15.9`, `gen:client-router` generated 6 client routes, `test:migration` passed with build, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 60 passed / 1 skipped full-chain Playwright tests; `git diff --check` passed.

2. Implement minimal Vue/template and style changes:

```vue
<p data-id="rankland-user-modal-organization" class="mb-0">
```

```less
[data-id='rankland-user-modal-organization'].mb-0 {
  margin: 0;
}
```

3. Verification commands:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

4. Commit boundary:

Commit only the Vue SRK wrapper, Ranklist full-chain test, this spec/plan, and migration documentation for the user modal organization-line product-class parity slice.
