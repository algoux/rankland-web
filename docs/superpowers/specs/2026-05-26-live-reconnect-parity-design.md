# Live Reconnect Product Parity Design

## Goal

Close the deferred Live product enhancement for automatic scroll-solution WebSocket reconnect/backoff while preserving the existing live ranklist, polling, query, and app-driven socket teardown behavior.

## Context

The old React page did not reconnect after WebSocket `close` or `error`; `docs/superpowers/specs/2026-05-22-live-websocket-policy-decision-design.md` intentionally preserved that as migration parity and recorded reconnect/backoff as future product work. The migration dashboard now lists automatic Live reconnect/backoff as the next product-level Live parity slice.

This slice supersedes the earlier doc-only decision only for the product-enhancement phase. The old close/error parity evidence remains useful historical context.

## Target Behavior

When `/live/:id` has `scrollSolution=1` and a live contest id:

- initial connection opens the existing `/ranking/record/:id?token=:token` WebSocket;
- `open` sets hidden status to `connected` and resets retry attempts;
- unexpected `close` or `error` keeps the ranklist visible and schedules a reconnect;
- reconnect status is `reconnecting`;
- delay uses bounded exponential backoff: 1000 ms, 2000 ms, 4000 ms, 8000 ms, then 10000 ms max;
- disabling `scrollSolution`, changing route/query, or unmounting closes the socket and clears pending reconnect timers without reconnecting.

## Architecture

Add `src/client/modules/live/live-websocket-reconnect.ts` with pure helpers:

- `getLiveWebSocketReconnectDelay(attempt)` for bounded backoff;
- `getNextLiveWebSocketReconnectAttempt(attempt)` for monotonic attempt increments.

Update `src/client/modules/live/live.view.vue`:

- track `scrollSolutionReconnectTimer`, `scrollSolutionReconnectAttempt`, and a monotonic `scrollSolutionConnectionRunId`;
- `connectScrollSolution()` accepts an attempt/run id and only reconnects when its run id is still current;
- `stopLiveUpdates()` clears pending reconnect timers and invalidates the current socket run before intentionally closing the socket.

The hidden `data-id="live-scroll-solution-status"` remains the E2E-visible state marker. The ranklist remains visible through reconnect transitions.

## Test Strategy

Unit tests:

- backoff helper returns 1000, 2000, 4000, 8000, then 10000 ms;
- invalid or negative attempts fall back to the first delay.

Full-chain E2E:

- open `/live/live-test-key?token=t0&scrollSolution=1`;
- emit a remote close through the existing WebSocket stub;
- assert status becomes `reconnecting`;
- assert a second WebSocket URL is created after backoff and status returns to `connected`;
- assert the ranklist remains visible throughout;
- keep the existing disable-scroll-solution test proving app-driven close does not reconnect.

## Non-Goals

- Do not add Toastify animation/pixel parity in this slice.
- Do not change live ranklist polling semantics.
- Do not add token refresh or server-side WebSocket behavior.
- Do not expose the hidden status marker visually.

## Known Risks

- Reconnect is a product enhancement beyond old React parity. It is deliberately scoped to scroll-solution WebSocket reliability and guarded by deterministic tests.
- Full-chain uses a browser WebSocket stub, so it verifies client lifecycle and URL behavior rather than a real backend socket.
