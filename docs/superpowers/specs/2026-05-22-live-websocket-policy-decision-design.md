# Live WebSocket Policy Decision Design

## Goal

Close the `/live/:id` WebSocket close/error/reconnect policy review by documenting the migrated Vue behavior as parity with the old React page and explicitly deferring automatic reconnect as a future product enhancement.

## Source Evidence

The old React live page at `rankland-fe/src/pages/live/[id].tsx`:

- opens `WebSocket` only when `scrollSolution=1` and a live `id` exists;
- closes the current socket when the effect is cleaned up;
- sets `wsError` to `true` on both `close` and `error`;
- does not schedule a reconnect, retry, backoff, or second `new WebSocket(...)` after close/error.

The current Vue live page at `src/client/modules/live/live.view.vue` now:

- opens `WebSocket` only when `scrollSolution=1` and `info.id` exists;
- closes the current socket on route/query teardown and component unmount;
- maps `close` and `error` to `scrollSolutionStatus = 'error'`;
- keeps the ranklist visible after realtime socket failures;
- has deterministic full-chain coverage for browser error events, unexpected remote close, and app-driven close when disabling scroll-solution mode.

## Decision

Do not add automatic WebSocket reconnect in the migration parity phase.

This preserves the old public behavior and avoids introducing new event duplication, queue ordering, lifecycle, or token-refresh semantics during migration. A reconnect/backoff design may be added later as a product improvement, but it should be specified separately from React-to-Vue parity.

Update 2026-05-26: that later product-improvement phase is now specified in `docs/superpowers/specs/2026-05-26-live-reconnect-parity-design.md` and implemented as bounded automatic reconnect/backoff. This earlier decision remains the historical migration-parity record.

## Non-Goals

This decision slice does not change runtime code, retry behavior, socket.io producer behavior, realtime event rendering, or scroll-solution visual styling.

## Verification Strategy

Runtime behavior is already covered by:

- `/live/:id` full-chain success path with connected WebSocket and binary realtime event display;
- WebSocket browser `error` event coverage;
- unexpected remote `close` coverage;
- app-driven close coverage when `scrollSolution` is disabled.

This slice is documentation-only. Verification is limited to source inspection, `rg` checks for reconnect logic, status/spec/plan diff review, and `git diff --check`.

## Acceptance Criteria

- `docs/migration/status.md` no longer lists live reconnect policy as an unreviewed risk.
- The docs state that no automatic reconnect is intentional parity with the old React page.
- Future automatic reconnect is recorded as a product enhancement/deferred decision, not a hidden migration gap.
