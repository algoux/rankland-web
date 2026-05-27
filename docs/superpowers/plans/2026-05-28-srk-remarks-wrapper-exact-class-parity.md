# SRK Remarks Wrapper Exact Class Parity Plan

Date: 2026-05-28
Branch: `migration/live-page-foundation`

## Scope

Remove the Vue-only remarks wrapper product class while preserving old React `mb-4 text-center` DOM/style behavior.

## Tasks

- [x] Compare old React remarks wrapper with the current Vue wrapper.
- [x] RED: update ranklist full-chain assertions to require exact wrapper class list `mb-4 text-center`, no `rankland-ranklist-remarks`, 16px bottom margin, and centered alignment.
- [x] GREEN: remove `rankland-ranklist-remarks` from the template and move wrapper spacing/alignment CSS to the old class combination.
- [x] Run focused ranklist RED/GREEN.
- [x] Run the full ranklist full-chain file.
- [x] Update migration status, manual acceptance, and final integration review docs.
- [x] Run full migration gate and `git diff --check`.
- [x] Commit as `fix: 还原 SRK 备注外壳精确类名`.

## Verification Evidence

- RED focused command:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
```

Observed failure: expected `['mb-4', 'text-center']`, received `['rankland-ranklist-remarks', 'mb-4', 'text-center']`.

- GREEN focused command: same focused Playwright command, `1 passed`.

- Ranklist regression:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Observed `9 passed`.

- Full migration gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Observed Node `v24.11.1`, pnpm `8.15.9`; generated 6 client routes; build passed; unit suite `36 passed` / `154 passed`; SSR `1 passed`; shallow E2E `1 passed`; full-chain E2E `60 passed` / `1 skipped`; `git diff --check` passed.

## Commit Boundary

Commit only the renderer, ranklist full-chain test, this spec/plan, and migration documentation for the SRK remarks wrapper exact-class parity slice.
