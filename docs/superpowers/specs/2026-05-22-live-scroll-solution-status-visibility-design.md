# Live Scroll-Solution Status Visibility Design

## Goal

Polish the migrated `/live/:id` realtime event display by hiding the internal scroll-solution WebSocket status text from the visible panel while keeping the status DOM available for deterministic full-chain assertions.

## Source Behavior

The old React `ScrollSolution` component renders a React Toastify container and individual solution rows. It does not show a visible `connected`, `error`, or `disabled` status label inside the bottom-left realtime panel. The live page keeps WebSocket error state internally, but the ranklist remains visible and the toast panel layout is row-only.

The current Vue `LiveScrollSolution` renders:

- a visible `data-id="live-scroll-solution-status"` text row;
- then the realtime solution rows.

That status row is useful for tests, but it is not part of the old user-visible UI and adds extra vertical content above realtime events.

## Target Behavior

- Keep updating `scrollSolutionStatus` exactly as before.
- Keep `data-id="live-scroll-solution-status"` in the DOM so existing full-chain tests can assert `connected` and `error`.
- Hide the status text visually so the realtime panel matches the old row-only presentation.
- Do not change WebSocket close/error handling, queue timing, event parsing, or mobile layout.

## Test Strategy

Extend the existing `/live/:id` full-chain desktop test to assert:

- the status element still has text `connected`;
- the same status element is hidden from the visible UI.

The existing WebSocket error/close tests continue to assert the hidden status text changes to `error`.

## Acceptance Criteria

- The visible realtime panel no longer shows a status row above solution rows.
- Existing WebSocket status assertions continue to work.
- `/live/:id` full-chain tests pass.
- `docs/migration/status.md` records realtime status visibility polish and keeps remaining live work focused on product review / event display polish.
