# Live Page Visual Review Design

## Context

The live route already has full-chain coverage for polling, WebSocket setup, realtime scroll-solution rendering, WebSocket error/close handling, mobile toggle visibility, and realtime panel screenshots under `focus=yes&scrollSolution=1`.

The remaining page-level visual gap is the normal public `/live/:id` route rendered under the Vue app shell, without focus mode and without the realtime side panel.

## Goal

Add focused visual/layout review for the normal `/live/:id` public route.

## Scope

- Capture desktop and mobile screenshots for `/live/live-test-key?token=t0`.
- Assert no page-level horizontal overflow.
- Assert app shell and live ranklist wrappers are visible.
- Assert key live controls stay within viewport bounds.
- Preserve existing live behavior coverage.

## Non-Goals

- Re-testing realtime scroll-solution panel screenshots; that is covered by `live realtime visual review`.
- Implementing automatic WebSocket reconnect.
- Pixel-perfect React Toastify/Ant Design animation parity.
- Full product redesign of the live route.

## Architecture

Extend `tests/e2e/full-chain/live.spec.ts` with route-local layout helpers and a normal public live page screenshot test. Fix route CSS only if assertions expose page-level overflow or out-of-bounds controls.

## Acceptance Criteria

- Live desktop/mobile screenshots are produced for the normal public route.
- The page hydrates before screenshots.
- Page-level horizontal overflow is not present.
- Header actions, progress, and footer wrappers stay within viewport bounds.
- Existing live full-chain assertions continue passing.
