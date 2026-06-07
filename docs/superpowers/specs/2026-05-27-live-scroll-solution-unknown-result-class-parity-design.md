# Live Scroll Solution Unknown Result Class Parity Design

## Context

Old React `ScrollSolution.renderResultLabel()` maps known realtime result labels to visual classes:

- `FB` -> `result result-fb`
- `AC` -> `result result-ac`
- rejected labels such as `WA`, `TLE`, `CE` -> `result result-rj`
- `?` -> `result result-fz`

For any other result, old React renders:

```tsx
<div className="result">--</div>
```

The migrated Vue helper currently returns `result-unknown` for this fallback case. That adds a Vue-only class to the product DOM even though the displayed text already matches old React as `--`.

## Goal

Restore the old fallback result class contract for Live ScrollSolution: unknown results should render only the base `result` / migrated hook classes, with no extra `result-unknown` class.

## Scope

- Update `getScrollSolutionResultClass()` to return an empty class for unknown results.
- Keep `getScrollSolutionResultText()` returning `--` for unknown results.
- Keep all known result classes, queue behavior, delays, Toastify presentation, and WebSocket behavior unchanged.

## Non-Goals

- Do not alter realtime protobuf parsing.
- Do not change Toastify layout, animation, or timing behavior.
- Do not change mobile visibility or scroll-solution toggle behavior.

## Test Strategy

Use the existing `tests/unit/live-scroll-solution-state.spec.ts` helper coverage:

- RED: change the unknown-result expectation from `result-unknown` to `''`; it should fail with the current helper.
- GREEN: return `''` from the fallback branch.

This is a pure helper/DOM-class contract. Existing full-chain Live coverage continues to verify Toastify layout and known `AC` result classes.

## Acceptance Criteria

- Unknown Live ScrollSolution results display `--`.
- Unknown Live ScrollSolution results do not add a Vue-only `result-unknown` class.
- Known `FB`, `AC`, rejected, and `?` classes remain unchanged.
- Full migration gate passes and migration docs record the slice.
