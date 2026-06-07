# SRK Header Meta Product Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Vue-only SRK header metadata product classes from contributors, ref-links, and time nodes while preserving old React utility class behavior.

**Architecture:** Keep the shared Vue ranklist wrapper and stable `data-id` selectors. Add full-chain assertions for the old class lists first, then move scoped styles from Vue-only product classes to `data-id` / utility class selectors.

**Tech Stack:** Vue 3 SFC, scoped LESS, Playwright full-chain E2E, RankLand migration docs.

---

## Files

- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Create: `docs/superpowers/specs/2026-05-28-srk-header-meta-product-class-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-28-srk-header-meta-product-class-parity.md`

## Tasks

- [x] Create the design spec and implementation plan.
- [x] Add RED full-chain assertions for header metadata class lists.
- [x] Run focused ranklist full-chain test and confirm expected failure.
- [x] Remove the Vue-only header metadata product classes.
- [x] Run focused GREEN test and the full ranklist full-chain file.
- [x] Update migration docs with verification evidence.
- [x] Run full migration gate and `git diff --check`.
- [x] Commit as `fix: 还原 SRK 头部元信息类名`.

## Step Details

1. Update the main ranklist full-chain test assertions:

```ts
expect(headerUtilityClasses.contributorsClasses).toEqual(['mb-0']);
expect(headerUtilityClasses.contributorsClasses).not.toContain('rankland-ranklist-contributors');
expect(headerUtilityClasses.refLinksClasses).toEqual([]);
expect(headerUtilityClasses.refLinksClasses).not.toContain('rankland-ranklist-ref-links');
expect(headerUtilityClasses.timeClasses).toEqual(['text-center', 'mb-0']);
expect(headerUtilityClasses.timeClasses).not.toContain('rankland-ranklist-time');
```

Expected RED: focused ranklist test fails because current Vue still emits the three Vue-only product classes.

Observed RED: the focused ranklist full-chain test failed because current Vue reported contributors classes `["rankland-ranklist-contributors", "mb-0"]` instead of the old exact `["mb-0"]` contract.

2. Implement the minimal Vue/template and style changes:

```vue
<p
  v-if="headerContributors.length > 0"
  data-id="rankland-ranklist-contributors"
  class="mb-0"
>
```

```vue
<span v-if="mainRefLinks.length > 0" data-id="rankland-ranklist-ref-links">
```

```vue
<p data-id="rankland-ranklist-time" class="text-center mb-0">{{ contestTimeRange }}</p>
```

```less
[data-id='rankland-ranklist-contributors'].mb-0,
[data-id='rankland-ranklist-ref-links'] {
  margin: 0;
  color: var(--rankland-legacy-text-color);
  font-size: 14px;
}

[data-id='rankland-ranklist-time'].text-center.mb-0 {
  margin: 0;
  color: var(--rankland-legacy-text-color);
  font-size: 14px;
}
```

Observed GREEN: the focused ranklist full-chain test passed with `1 passed`; the full ranklist full-chain file passed with `9 passed`.

Observed full gate: `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check` passed with Node `v24.11.1`, pnpm `8.15.9`, 6 generated client routes, build pass, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, 60 passed / 1 skipped full-chain Playwright tests, and `git diff --check` pass.

3. Verification commands:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

4. Commit boundary:

Commit only the Vue SRK wrapper, ranklist full-chain test, this spec/plan, and migration documentation for the SRK header metadata product-class parity slice.
