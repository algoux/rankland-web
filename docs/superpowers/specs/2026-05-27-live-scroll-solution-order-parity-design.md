# Live Scroll-Solution Order Parity Design

## Context

The old React live page renders realtime submissions through `ScrollSolution`, which wraps React Toastify with `newestOnTop={false}`. When multiple toast rows are visible, the older visible row remains before the newer row.

The Vue migration already restores the Toastify container classes, row chrome, animation, queue timing, and viewport behavior, but `showScrollSolution` currently prepends new displayed rows. That makes the newest realtime submission appear first, which does not match the old Toastify ordering.

## Design

Restore oldest-first visible ordering for live scroll-solution rows:

- keep `FB` rows immediate and non-`FB` rows queued as today;
- keep current delay, dismiss, reconnect, and visible-limit behavior;
- append newly displayed rows after existing visible rows;
- trim overflow from the oldest side only when the visible limit is exceeded, so the component still respects the legacy limit.

## Tests

Extend `tests/e2e/full-chain/live.spec.ts` with a focused full-chain assertion:

- open `/live/live-test-key?token=t0&scrollSolution=1&focus=yes`;
- emit two WebSocket solution messages while both remain visible;
- assert both toast rows are visible;
- assert the first visible row is the first emitted solution and the second visible row is the second emitted solution.

RED should fail on current Vue because the second emitted row is prepended. GREEN should pass after appending new visible rows.

## Non-Goals

- Do not change Toastify styling, animation, status marker, or mobile behavior.
- Do not change reconnect, polling, or SRK table rendering.
- Do not alter the queue scheduling algorithm beyond visible row order.
