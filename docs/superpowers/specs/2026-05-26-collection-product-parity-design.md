# Collection Product Parity Design

## Context

The collection foundation route intentionally deferred exact Ant Design menu parity, category icons, and mobile nav behavior. The old React page in `rankland-fe/src/pages/collection/[id].tsx` uses Ant Design `Menu` and `Button`, category-specific logo images, persisted nav collapsed state, and a mobile default that collapses the nav when a ranklist is selected.

## Goal

Bring the Vue collection page closer to product-level parity by replacing the custom tree with an Ant Design Vue inline menu, restoring category icons, and matching the old mobile collapsed-nav behavior.

## Scope

- Render collection navigation with Ant Design Vue `a-menu` in inline mode.
- Render the collapse control with Ant Design Vue `a-button` and fold/unfold icons.
- Restore category icons for `dir-icpc`, `dir-ccpc`, `dir-provincial`, and `dir-university-level`, switching between light and dark assets after hydration based on the `html` theme class.
- Preserve stable `data-id="collection-menu-item-..."` and `data-collection-key` hooks.
- Preserve selected ranklist state and open ancestor directory keys.
- Preserve localStorage key `CollectionNavCollapsed`.
- On mobile, default to collapsed when a valid ranklist is selected and no explicit collapsed preference exists; collapse after ranklist selection; hide the ranklist panel while mobile nav is expanded.
- Mount Ant Design Vue `a-menu` through `ClientOnly`; its ResizeObserver/overflow wrapper produces SSR/client hydration node mismatches in inline mode.

## Non-Goals

- Do not change the collection data contract, route shape, SSR API behavior, or invalid `rankId` cleanup.
- Do not claim full pixel-perfect parity for all spacing, animation, or remaining-height calculation.
- Do not change the SRK renderer itself in this slice.

## Tests

Extend `tests/e2e/full-chain/collection.spec.ts`:

- Assert the collection nav uses Ant Design Vue inline menu classes.
- Assert directory category icons are rendered with stable `data-id` and image alt text.
- Assert the selected ranklist is represented by `.ant-menu-item-selected`.
- Assert the collapse button is an Ant Design Vue button and includes fold/unfold icon classes.
- Assert mobile selected-ranklist loads start collapsed when localStorage has no preference.
- Assert mobile expanded nav hides the ranklist panel, and selecting a menu item collapses the nav again.

## Acceptance

- Focused collection full-chain spec passes.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before claiming the slice verified.
- `docs/migration/status.md` records Collection product parity progress and remaining risks.
