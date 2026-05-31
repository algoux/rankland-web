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

`ready`: concrete, reproducible, and likely safe if implemented as a focused theme/style parity slice.
