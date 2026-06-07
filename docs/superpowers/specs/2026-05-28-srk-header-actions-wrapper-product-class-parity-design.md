# SRK Header Actions Wrapper Product Class Parity Design

## Context

The old React `StyledRanklistRenderer` renders export/share actions as a `ClientOnly` fragment inside the header meta block. It does not expose a `rankland-ranklist-header-actions` product class.

The Vue migration still needs a stable wrapper for selectors and implementation, but the wrapper currently renders:

```html
<div data-id="rankland-ranklist-header-actions" class="rankland-ranklist-header-actions">
```

The previous header-action slices already restored trigger utility classes, spacing, colors, hover behavior, and the layout-neutral `display: inline` model. This slice removes the remaining Vue-only wrapper class while preserving those verified behaviors through the existing `data-id` hook.

## Scope

- Remove `.rankland-ranklist-header-actions` from product DOM.
- Keep `data-id="rankland-ranklist-header-actions"` so existing E2E selectors and viewport checks remain stable.
- Move scoped CSS selectors from `.rankland-ranklist-header-actions` to `[data-id='rankland-ranklist-header-actions']`.
- Preserve export/share trigger class lists, Ant Design Vue dropdown behavior, old light/dark link colors, hover colors, border/padding parity, normal gaps, and `display: inline`.

## Non-Goals

- Do not remove the wrapper node in this slice.
- Do not change export/share menu structure or converter behavior.
- Do not change ref-link extra action styling.
- Do not change low-level SRK table renderer internals.

## Test Strategy

Extend existing full-chain ranklist/live header action assertions to read the wrapper class list:

- RED: focused `/ranklist/:id` full-chain test fails because the wrapper class list contains `rankland-ranklist-header-actions`.
- GREEN: the same focused test passes with an empty wrapper class list while the existing trigger/display/gap/color assertions still pass.
- Run the full ranklist and live full-chain files because both routes render the shared header actions in different meta states.

## Acceptance Criteria

- `[data-id="rankland-ranklist-header-actions"]` has an empty class list on ranklist and live routes.
- Existing export/share trigger class-list assertions are unchanged.
- Existing header-action display/gap/style assertions continue to pass.
- `docs/migration/status.md` records the verified slice and gate evidence.
