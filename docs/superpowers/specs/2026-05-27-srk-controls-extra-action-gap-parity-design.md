# SRK Controls Extra Action Gap Parity Design

## Context

The old React `StyledRanklistRenderer` renders the controls row as:

```tsx
<div className="mt-3 mx-4 flex justify-between items-center">
  {showFilter && <div>...</div>}
  <div>{renderExtraActionArea ? renderExtraActionArea(memorizedData) : null}</div>
</div>
```

The old Tailwind class list does not add a `gap` declaration to the controls root. The extra-action wrapper is a plain `div` with normal block layout. The spacing inside the Live scroll-solution toggle comes from its own `inline-flex items-center` / `mr-1` structure, not from the wrapper.

The migrated Vue SRK wrapper currently keeps the old class tokens, but adds Vue-only chrome:

- `.rankland-ranklist-controls { gap: 16px; }`
- `.rankland-ranklist-extra-action { display: inline-flex; align-items: center; gap: 8px; }`

This is visible on `/live/:id`, where `extra-action` renders the scroll-solution toggle on the right side of the controls row.

## Decision

- Preserve the old controls utility class tokens and existing migrated `data-id` hooks.
- Remove the Vue-only root controls `gap: 16px` so the controls row spacing comes from old `justify-between` behavior and child utility classes.
- Restore the extra-action wrapper to old plain-div chrome by removing the shared inline-flex/gap styling from `.rankland-ranklist-extra-action`.
- Keep `.rankland-ranklist-filter` inline-flex styling because old filter internals already have verified `ml-2` / `ml-5` / `mr-1` spacing and Ant Design controls.
- Keep the Live toggle's own `.live-scroll-toggle` 4px text-to-switch gap unchanged because that was already restored from old behavior.

## Test Strategy

Use the existing `/live/:id` full-chain test because Live is the public route that renders `extra-action`.

Add a helper that reads:

- controls root class list;
- controls root computed display, justify-content, align-items, column-gap, and row-gap;
- extra-action wrapper computed display, column-gap, and row-gap;
- Live toggle computed display and column-gap.

Verify RED first: current Vue CSS reports `16px` root gap and `inline-flex` / `8px` extra-action wrapper gap.

Then remove the Vue-only CSS and verify focused GREEN. The full migration gate remains required before commit.

## Acceptance Criteria

- `/live/:id` controls root still has `mt-3 mx-4 flex justify-between items-center`.
- Controls root computes `display: flex`, `justify-content: space-between`, `align-items: center`, and no declared gap, which Chromium reports as `column-gap: normal` and `row-gap: normal`.
- Extra-action wrapper computes old plain-div chrome with `display: block`, `column-gap: normal`, and `row-gap: normal`.
- Live toggle keeps its source `display: inline-flex` behavior and `column-gap: 4px`.
- Existing filter controls, Live scroll-solution behavior, desktop/mobile viewport bounds, and all migration gates remain green.
