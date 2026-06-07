# SRK Footer Wrapper Product Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Vue-only `.rankland-ranklist-footer` product class from the shared SRK footer root while preserving old React utility classes, text, links, and spacing behavior.

**Architecture:** Keep the shared Vue ranklist wrapper and stable `data-id` selector. Add full-chain RED assertions for the exact old footer root class list, then retarget scoped styles from the product class to the `data-id` plus utility-class selector.

**Tech Stack:** Vue 3 SFC, scoped LESS, Playwright full-chain E2E, RankLand migration docs.

---

## Files

- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Create: `docs/superpowers/specs/2026-05-28-srk-footer-wrapper-product-class-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-28-srk-footer-wrapper-product-class-parity.md`

## Tasks

- [x] Create the design spec and implementation plan.
- [x] Add RED full-chain assertions for the exact footer root class list.
- [x] Run focused Ranklist full-chain test and confirm expected failure.
- [x] Remove the Vue-only footer root product class.
- [x] Run focused GREEN test and the full Ranklist full-chain file.
- [x] Update migration docs with verification evidence.
- [x] Run full migration gate and `git diff --check`.
- [x] Commit as `fix: 还原 SRK 页脚外壳类名`.

## Step Details

1. Update Ranklist full-chain assertions:

```ts
expect(await getRanklistRendererTopLevelDom(page)).toEqual([
  // ...
  {
    tagName: 'FOOTER',
    dataId: 'rankland-ranklist-footer',
    classList: ['text-center', 'mt-8'],
  },
]);

expect(footerUtilityClasses.footerClasses).toEqual(['text-center', 'mt-8']);
expect(footerUtilityClasses.footerClasses).not.toContain('rankland-ranklist-footer');
```

Expected RED: focused Ranklist full-chain test fails because current Vue still emits `rankland-ranklist-footer`.

Observed RED: the focused Ranklist full-chain test failed because the footer root still reported `["rankland-ranklist-footer", "text-center", "mt-8"]` instead of the old exact `["text-center", "mt-8"]` contract.

2. Implement minimal Vue/template and style changes:

```vue
<footer v-if="showFooter" data-id="rankland-ranklist-footer" class="text-center mt-8">
```

```less
[data-id='rankland-ranklist-footer'].text-center.mt-8 {
  margin-top: 32px;
  text-align: center;
}
```

Observed GREEN: the focused Ranklist full-chain test passed with `1 passed`; the full Ranklist full-chain file passed with `9 passed`.

Observed full gate: `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check` passed with Node `v24.11.1`, pnpm `8.15.9`, 6 generated client routes, build pass, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, 60 passed / 1 skipped full-chain Playwright tests, and `git diff --check` pass.

3. Verification commands:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

4. Commit boundary:

Commit only the Vue SRK wrapper, Ranklist full-chain test, this spec/plan, and migration documentation for the SRK footer wrapper product-class parity slice.
