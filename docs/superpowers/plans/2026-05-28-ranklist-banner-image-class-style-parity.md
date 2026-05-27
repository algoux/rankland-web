# Ranklist Banner Image Class/Style Parity Plan

Date: 2026-05-28
Branch: `migration/live-page-foundation`

## Scope

Restore old React SRK contest banner image class/style parity in the shared ranklist renderer.

## Tasks

- [x] Compare old React `StyledRanklistRenderer` banner image contract with current Vue renderer.
- [x] Add RED full-chain assertions for exact banner image class list, missing Vue-only class, and old inline size style.
- [x] Run focused RED and confirm failure for the migrated Vue-only `rankland-ranklist-banner` class.
- [x] Change Vue renderer so the image class is `mb-2` and size is inline `max-width: min(100%, 1820px); max-height: 40vh`.
- [x] Remove Vue-only banner image class sizing CSS while preserving the local 8px `mb-2` margin rule through the stable `data-id`.
- [x] Run focused GREEN for the ranklist SSR/hydration/full-chain test.
- [x] Run the full ranklist full-chain file.
- [x] Update migration status, manual acceptance, and final integration review docs.
- [x] Run full migration gate and `git diff --check`.
- [ ] Commit as `fix: 还原 SRK 横幅图片样式合同`.

## Verification Evidence

- RED focused command:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
```

Observed failure after the test was corrected to inspect the inline style string: expected banner image class list `['mb-2']`, received `['rankland-ranklist-banner', 'mb-2']`.

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

Observed Node `v24.11.1`, pnpm `8.15.9`, generated 6 client routes, build passed, 36 unit files / 154 unit tests passed, 1 SSR smoke test passed, 1 shallow Playwright test passed, and default full-chain Playwright reported 60 passed / 1 skipped. `git diff --check` exited cleanly.

## Commit Boundary

Commit only the renderer, full-chain test, this spec/plan, and migration documentation for the banner image class/style parity slice.
