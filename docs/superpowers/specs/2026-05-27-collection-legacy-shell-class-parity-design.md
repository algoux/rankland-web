# Collection Legacy Shell Class Parity Design

## Context

The old React collection page uses a three-part shell that is referenced by legacy LESS selectors:

- Root wrapper: `.srk-collection-container`
- Fixed navigation: `.srk-collection-nav`
- Ranklist panel: `.srk-collection-ranklist`

The old navigation rule also uses `z-index: 1`, while the old hidden header has no explicit z-index. The Vue page already restores the product behavior for collection data loading, Ant Design Vue menu rendering, category icons, collapse behavior, hidden header DOM, and old nav colors. It still primarily exposes migration-era shell class names (`collection-page`, `collection-nav`, `collection-ranklist-panel`), keeps the nav at `z-index: 10`, and gives the hidden header its own `z-index: 1`.

## Goal

Restore the old collection shell class contract and nav stacking token while preserving the current stable `data-id` selectors and verified layout behavior.

## Scope

- Add full-chain coverage for old shell classes:
  - `[data-id="collection-content"].srk-collection-container`
  - `[data-id="collection-nav"].srk-collection-nav`
  - `[data-id="collection-ranklist-panel"].srk-collection-ranklist`
- Assert the collection nav computed `z-index` is `1`.
- Assert the hidden header computed `z-index` is `auto` so it does not cover the old nav layer.
- Add the old classes alongside the existing Vue classes rather than renaming away current selectors.
- Change `.collection-nav` z-index from `10` to `1`.
- Remove the explicit `.collection-hidden-header` z-index.

## Non-Goals

- Do not change collection async data, route query handling, invalid `rankId` cleanup, menu generation, or selected-ranklist rendering.
- Do not change nav width, menu height, transition timing, mobile collapse behavior, or hidden-header sizing.
- Do not pursue broader SRK table pixel parity in this slice.

## Test Strategy

Extend `tests/e2e/full-chain/collection.spec.ts` in the existing collection menu/chrome full-chain test:

```ts
await expect(page.locator('[data-id="collection-content"]')).toHaveClass(/srk-collection-container/);
await expect(page.locator('[data-id="collection-nav"]')).toHaveClass(/srk-collection-nav/);
await expect(page.locator('[data-id="collection-ranklist-panel"]')).toHaveClass(/srk-collection-ranklist/);
await expect(page.locator('[data-id="collection-nav"]')).toHaveCSS('z-index', '1');
await expect(page.locator('.srk-collection-hidden-header')).toHaveCSS('z-index', 'auto');
```

The focused test should fail before implementation because these classes are missing, nav z-index is `10`, and the hidden header has explicit `z-index: 1`, then pass after the template/style change.

## Acceptance Criteria

- Focused collection full-chain RED/GREEN is captured.
- Full migration gate passes.
- Migration status, manual checklist, and final integration review mention collection legacy shell class parity.
- Slice is committed with a Chinese Conventional Commit message.
