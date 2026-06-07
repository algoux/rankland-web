# PAR-006B Evidence — Ant Design primary color visual parity

## Finding

The old React app uses RankLand orange for visible light-mode primary controls. The migrated Vue app still shows Ant Design Vue default blue on reviewed primary controls.

## Evidence

- Search:
  - Old: `test-results/par-006-visual-review/search-desktop-old.png`
  - New: `test-results/par-006-visual-review/search-desktop-new.png`
  - Selector candidates: `.ant-input-search-button.ant-btn-primary`, `[data-id="search-input"]` parent `.ant-input-search`
  - Difference: old Search button is orange; new Search button is blue.
- Shared SRK controls on `/ranklist/test-key?focus=yes`, `/collection/official?rankId=test-key`, and `/live/live-test-key?token=t0`:
  - Old: `ranklist-desktop-old.png`, `collection-desktop-old.png`, `live-desktop-old.png`
  - New: `ranklist-desktop-new.png`, `collection-desktop-new.png`, `live-desktop-new.png`
  - Selector candidates: `[data-id="rankland-ranklist-marker-filter"] .ant-radio-button-wrapper-checked`, `[data-id="rankland-ranklist-controls"]`
  - Difference: old active filter controls use orange border/text treatment; new active controls use default blue.

## Suggested Regression Test

Add focused full-chain assertions for:

- `/search`: computed background/border color for `.ant-input-search-button.ant-btn-primary`.
- `/ranklist/test-key?focus=yes`: computed checked marker filter color/border/background for `[data-id="rankland-ranklist-marker-filter"] .ant-radio-button-wrapper-checked`.
- Optionally reuse the same shared SRK assertion on `/collection/official?rankId=test-key` or `/live/live-test-key?token=t0` if the implementation touches shared theme CSS.

## Acceptance Criteria

- Visible light-mode primary controls use the old RankLand orange primary color family.
- Existing dark-mode documented primary colors remain green.
- Existing search, ranklist, collection, live bounds/full-chain tests remain green.

## Current Classification

`done`: implemented in Batch `BLD-2026-05-31-02`.

## Builder Implementation

- Added a shared Ant Design Vue `ConfigProvider` theme token in `src/client/App.vue` so light-mode Ant primary/link color derives from old React `#ff8104`, and dark-mode primary/link color derives from old React `#f6ac06`.
- Registered `ConfigProvider` in `src/client/main.ts`.
- Added a narrow global compatibility hook in `src/client/index.less` for `.ant-btn-primary` and checked `.ant-radio-button-wrapper` computed styles because Ant Design Vue 4 token output does not exactly match the old Ant Design 4 Less output for those controls.
- Added focused full-chain assertions in `tests/e2e/full-chain/search.spec.ts` and `tests/e2e/full-chain/ranklist.spec.ts`.

## Verification

- RED: `corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts tests/e2e/full-chain/ranklist.spec.ts -g "shows recent ranklists|renders legacy Ant Design filter controls|passes the RankLand dark theme"` failed before the fix with default blue / non-primary computed styles.
- GREEN: the same focused command passed after the fix: 3 passed.
