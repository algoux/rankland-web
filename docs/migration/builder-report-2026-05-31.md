# RankLand Builder Report — 2026-05-31

## Scope

Executed the controlled Builder goal from `docs/migration/builder-goal.md` on branch `migration/live-page-foundation`.

## PAR-006 Visual Review

- Old reference: `/Users/cooper/Projects/RankLand/rankland-fe`, built with Node `v20.19.5` and served at `http://127.0.0.1:4321`.
- New target: `rankland-web`, served with Node `v24.11.1`, app `http://127.0.0.1:3100`, mock API `http://127.0.0.1:3101`.
- Routes reviewed:
  - `/`
  - `/search`
  - `/ranklist/test-key?focus=yes`
  - `/collection/official?rankId=test-key`
  - `/playground`
  - `/live/live-test-key?token=t0`
- Viewports reviewed: desktop `1440x900`, mobile `390x844`.
- Screenshot artifacts: `test-results/par-006-visual-review/`.

## Promoted Child Items

- `PAR-006A` — App shell logo asset parity: promoted and implemented.
- `PAR-006B` — Ant Design primary color visual parity: promoted as `ready`.
- `PAR-006C` — Collection category logo size parity: promoted as `ready`.

## Implemented Fix

- Replaced `src/client/assets/logo.png` with old React `RL` logo from `/Users/cooper/Projects/RankLand/rankland-fe/src/assets/logo.png`.
- Added `tests/unit/app-logo-asset.spec.ts` to lock the asset hash and dimensions.
- Stabilized the app-shell viewport-bounds helper so it waits for async shell styles to settle before reading document overflow.

## Verification

- RED: `corepack pnpm exec vitest run tests/unit/app-logo-asset.spec.ts` failed on the pre-fix logo hash.
- GREEN: `corepack pnpm exec vitest run tests/unit/app-logo-asset.spec.ts` passed after replacing the asset.
- Focused retry: `E2E_BASE_URL=http://127.0.0.1:3100 FULL_CHAIN_MOCK_PORT=3101 corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/app-shell.spec.ts -g "keeps the app shell within desktop and mobile viewport bounds"` passed.
- Final gates:
  - `git diff --check` passed.
  - `corepack pnpm run gen:client-router` passed and generated 6 client routes.
  - `corepack pnpm test:migration` passed: build, 39 unit files / 159 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 61 passed / 1 skipped full-chain Playwright tests.

Final gates are recorded in the conversation and commit checkpoint for this Builder window.

## Stop Condition

Stopped after completing/updating 5 review/ticket items in this Builder window:

1. `PAR-006` final route visual review completed.
2. `PAR-006A` promoted.
3. `PAR-006B` promoted.
4. `PAR-006C` promoted.
5. `PAR-006A` implemented and verified.

No further ready items were implemented in this window.

## Batch BLD-2026-05-31-02

### PAR-006B — Ant Design primary color visual parity

- Status: implemented and focused-verified.
- Old source confirmed:
  - `/Users/cooper/Projects/RankLand/rankland-fe/src/styles/antd.light.less` sets `@primary-color: #ff8104`.
  - `/Users/cooper/Projects/RankLand/rankland-fe/src/styles/antd.dark.less` sets `@primary-color: #f6ac06`.
  - Old compiled Ant Design 4 CSS uses those colors for `.ant-btn-primary` and checked `.ant-radio-button-wrapper`.
- New implementation:
  - Added global Ant Design Vue `ConfigProvider` theme tokens in `src/client/App.vue`.
  - Registered `ConfigProvider` in `src/client/main.ts`.
  - Added a focused global style hook in `src/client/index.less` to restore old computed primary button and checked radio styles where Ant Design Vue 4 token output differs from old Ant Design 4 Less output.
  - Added full-chain computed-style coverage in `tests/e2e/full-chain/search.spec.ts` and `tests/e2e/full-chain/ranklist.spec.ts`.
- Focused verification:
  - RED: `corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts tests/e2e/full-chain/ranklist.spec.ts -g "shows recent ranklists|renders legacy Ant Design filter controls|passes the RankLand dark theme"` failed before the product fix with default blue / non-primary control colors.
  - GREEN: same command passed after the fix: 3 passed.
