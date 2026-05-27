# Live Realtime Toastify DOM Parity Design

## Context

Old React source: `rankland-fe/src/components/plugins/ScrollSolution/ScrollSolution.tsx`.

Target Vue source: `src/client/modules/live/live-scroll-solution.vue`.

The old Live realtime submission panel is rendered through `react-toastify`. Its visible product structure is a Toastify container `div` with direct Toastify toast `div` rows. The current Vue implementation reuses the legacy class names but emits an `aside` container, an intermediate `ul`, and `li` toast rows. Styling keeps the current page usable, but the DOM shape is not the old product surface.

## Decision

Restore the Live realtime submission panel to the old Toastify DOM tag shape:

- `data-id="live-scroll-solution"` stays as the stable test hook, but the element becomes a `div`.
- visible realtime rows become direct child `div.Toastify__toast...` elements after the hidden status marker.
- remove the intermediate `ul.live-scroll-solution-list`.
- keep the hidden `data-id="live-scroll-solution-status"` marker for deterministic full-chain WebSocket assertions.

## Non-Goals

- Do not change WebSocket connection, reconnect, polling, queue timing, result mapping, or visible text.
- Do not alter mobile viewport safeguards.
- Do not change the SRK renderer or shared ranklist component.

## Testing

Update `tests/e2e/full-chain/live.spec.ts` to assert:

- the realtime container tag is `DIV`;
- no `ul` / `li` product structure exists inside the realtime panel;
- visible Toastify rows are `DIV` elements and direct children of the container after excluding the hidden status marker.

Run the focused Live full-chain test first to observe RED, then rerun it after implementation for GREEN. Because this is a public route DOM parity change, run the full Live full-chain file and the migration gate before committing.

## Acceptance Criteria

- `/live/:id?scrollSolution=1` still connects to the mock WebSocket and displays realtime rows.
- Toastify legacy classes and layout assertions continue to pass.
- The container and row DOM tags match old React Toastify output.
- `corepack pnpm test:migration` and `git diff --check` pass before the slice is committed.
