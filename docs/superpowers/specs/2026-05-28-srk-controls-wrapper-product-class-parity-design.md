# SRK Controls Wrapper Product Class Parity Design

Date: 2026-05-28
Branch: `migration/live-page-foundation`
Slice: SRK controls wrapper product class parity

## Problem

Old React `StyledRanklistRenderer` renders the controls root as a plain utility-class wrapper:

```tsx
<div className="mt-3 mx-4 flex justify-between items-center">
```

The migrated Vue wrapper currently renders:

```vue
<div data-id="rankland-ranklist-controls" class="rankland-ranklist-controls mt-3 mx-4 flex justify-between items-center">
```

The old utility tokens and computed layout are already covered, but the Vue-only `rankland-ranklist-controls` product class still leaks into the public DOM. That is inconsistent with the old React class contract and with the recent SRK product-class cleanup slices.

## Scope

- Remove only the Vue-only controls root product class.
- Keep the stable `data-id="rankland-ranklist-controls"` hook for tests and scoped styles.
- Preserve old utility tokens: `mt-3 mx-4 flex justify-between items-center`.
- Preserve computed controls layout: flex display, centered alignment, space-between justification, 12px top margin, 16px horizontal margins, and normal row/column gap.
- Preserve filter-control, extra-action, Ranklist, and Live behavior.

## Non-Goals

- Do not change Ant Design Vue Select/Switch/Radio behavior.
- Do not change Live scroll-solution toggle DOM or spacing.
- Do not change table wrapper, table spacer, footer, or low-level SRK renderer internals.
- Do not hand-edit generated route outputs.

## Test Strategy

Add RED assertions to existing full-chain coverage:

- Ranklist main route top-level DOM helper expects controls root class list exactly `['mt-3', 'mx-4', 'flex', 'justify-between', 'items-center']`.
- Ranklist controls utility assertion expects that exact old class list and explicitly rejects `rankland-ranklist-controls`.
- Live controls chrome assertion expects the same exact old class list and rejects `rankland-ranklist-controls`.

Then retarget scoped controls styles from `.rankland-ranklist-controls` to `[data-id='rankland-ranklist-controls'].mt-3.mx-4.flex.justify-between.items-center`.

## Acceptance Criteria

- Focused Ranklist full-chain test fails before implementation because current Vue still emits `rankland-ranklist-controls`.
- Focused Ranklist and Live full-chain tests pass after implementation.
- Full Ranklist and Live full-chain files pass.
- Full migration gate passes before commit.
- `git diff --check` passes.
- Migration status, manual checklist, final integration review, and this slice plan record the evidence.

## Risks

The controls root is shared by Ranklist, Collection selected-ranklist, Playground preview, and Live. Retargeting CSS to `data-id` must preserve the existing layout for all shared surfaces while avoiding broad selector effects.
