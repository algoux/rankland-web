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

`done`: implemented in Batch `BLD-2026-05-31-02`.

## Builder Implementation

- Confirmed the old React source uses `.srk-collection-menu-icon img` with Tailwind `w-8 h-8`, i.e. `32x32` rendered category logos.
- Root cause in the migrated Vue page: the existing scoped `.srk-collection-menu-icon img` rule did not pierce Ant Design Vue Menu icon slot DOM, so the `192x192` source images rendered at natural size.
- Fixed `src/client/modules/collection/collection.view.vue` by applying the existing icon container and image rules through `:deep`, without changing Collection data loading, routing, menu item construction, open-key behavior, or mobile collapse state.
- Extended `tests/e2e/full-chain/collection.spec.ts` to assert ICPC/CCPC category image bounding boxes, icon footprint, label visibility, and icon/label non-overlap on desktop and mobile-expanded navigation.

## Verification

- RED: `corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders the legacy Ant Design collection menu|uses the legacy mobile nav collapse behavior"` failed before the fix with `192x192` rendered category images.
- GREEN: the same focused command passed after the fix: 2 passed.
