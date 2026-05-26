# Collection Ranklist Panel Layout Parity Design

## Context

The old React collection page renders the selected ranklist inside `.srk-collection-ranklist`.
Its LESS contract includes `flex: 1` and `position: relative` on that node.

The Vue collection page already restores the legacy class name and margin/display animation behavior, but the panel still lacks the old `flex` and `position` declarations.

## Goal

Restore the legacy `.srk-collection-ranklist` layout CSS contract on the Vue collection ranklist panel without changing routing, data loading, mobile collapse behavior, or selected-ranklist rendering.

## Non-Goals

- Do not change the collection navigation width, remaining-height calculation, or collapse persistence behavior.
- Do not alter SRK renderer internals.
- Do not introduce broader collection layout refactors.

## Design

Add the missing CSS declarations to the existing Vue panel selector:

- `flex: 1`
- `position: relative`

The existing `collection-ranklist-panel` styles stay responsible for Vue-specific overflow and padding constraints that have already been verified.

## Test Strategy

Extend the existing full-chain collection menu/layout coverage to assert the computed style of `[data-id="collection-ranklist-panel"]`:

- `position` is `relative`
- `flex-grow` is `1`
- `flex-shrink` is `1`
- `flex-basis` is `0%`

The test should fail before implementation because the current panel computes as `position: static` and default flex values.

## Acceptance Criteria

- Focused collection full-chain test fails before implementation for the missing legacy panel CSS.
- Focused collection full-chain test passes after the minimal CSS change.
- Full migration gate passes:
  - `corepack pnpm run gen:client-router`
  - `corepack pnpm test:migration`
  - `git diff --check`
- Migration status, manual checklist, and final integration review reflect the verified slice.

## Risks

`flex: 1` has no visible effect unless the parent participates in flex layout, matching the old LESS where container `display: flex` was commented out. This slice intentionally restores the public CSS contract rather than redesigning layout structure.
