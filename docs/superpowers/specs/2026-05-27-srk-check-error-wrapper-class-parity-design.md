# SRK Check Error Wrapper Class Parity Design

## Context

The old React `StyledRanklist` checker-error branch renders structurally invalid SRK objects as:

```tsx
<div className="ml-8">
  <h3>Error occurred while checking srk:</h3>
  <pre>{srkCheckError}</pre>
</div>
```

The Vue migration currently preserves the visible heading, `pre` message, and `ml-8` spacing, but the wrapper also emits the Vue-only product class `rankland-ranklist-check-error`.

## Goal

Restore the old wrapper class contract exactly while preserving the stable `data-id="rankland-ranklist-check-error"` selector used by full-chain tests.

## Decisions

- The product class list should be exactly `ml-8`.
- The `data-id` hook remains because it is a test selector, not visible product DOM or styling.
- No SRK validation logic changes are included in this slice.
- No generated router output changes are expected.

## Test Strategy

- Tighten the existing Playground full-chain checker-error test to assert exact wrapper class parity.
- Confirm RED against the current Vue-only class.
- Remove the extra class and confirm GREEN with the same focused Playwright command.
- Run the full migration gate before committing.

## Acceptance Criteria

- Structurally invalid SRK object JSON in `/playground` renders the checker-error wrapper with exact class `ml-8`.
- The wrapper still contains the old `h3` text and non-empty `pre` message.
- Render-error Alert remains absent for checker errors.
- No external mock backend requests are made by this local checker-error path.

## Risks

Low risk. The removed class is not referenced by local CSS and the stable `data-id` test hook remains available.
