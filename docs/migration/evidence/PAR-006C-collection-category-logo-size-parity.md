# PAR-006C Evidence — Collection category logo size parity

## Finding

The old React Collection nav renders category logos as small menu icons. The migrated Vue Collection nav renders oversized category logo images, causing overlap with category labels and excessive left-rail visual weight.

## Evidence

- Route: `/collection/official?rankId=test-key`
- Desktop screenshots:
  - Old: `test-results/par-006-visual-review/collection-desktop-old.png`
  - New: `test-results/par-006-visual-review/collection-desktop-new.png`
- Mobile screenshots:
  - Old: `test-results/par-006-visual-review/collection-mobile-old.png`
  - New: `test-results/par-006-visual-review/collection-mobile-new.png`
- Selector candidates:
  - collection nav root: `.srk-collection-nav`
  - menu root: `.srk-collection-nav-menu`
  - category title images inside Ant Design menu submenu titles
- Difference: new ICPC/CCPC category logo images render far larger than the old menu icon footprint and visually collide with label text such as `ICPC` / `CCPC`.

## Suggested Regression Test

Extend `tests/e2e/full-chain/collection.spec.ts` with a focused assertion that:

- category logo bounding boxes stay within the old menu icon footprint at desktop and mobile viewports;
- submenu title text remains visible and does not overlap the icon box;
- existing selected-path open-key and collection bounds assertions still pass.

## Acceptance Criteria

- Collection category logos render at the old small menu-icon scale.
- ICPC/CCPC/category labels remain readable.
- Existing collection collapse/open-key/mobile behavior remains unchanged.

## Current Classification

`ready`: concrete, isolated to Collection nav presentation, and suitable for a focused Builder implementation slice.
