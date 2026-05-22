# Live Realtime Visual Review Design

## Goal

Complete a focused visual review slice for `/live/:id` realtime event display by adding deterministic full-chain layout assertions for the scroll-solution panel on desktop and mobile viewports.

## Source Behavior

The old React live page renders realtime submissions as a 250px bottom-left toast panel using `ScrollSolution`. The migrated Vue page already ports the core behavior:

- bottom-left 250px panel on desktop;
- 45px rows with score, user, problem, and result columns;
- result grouping and colors;
- queue timing and long-lived `FB` rows;
- no visible internal WebSocket status row.

The remaining risk is not a new feature gap, but whether the migrated panel has obvious layout defects such as blank rendering, viewport overflow, ranklist overlap on desktop, or unusable mobile placement.

## Target Behavior

The full-chain test should prove that:

- desktop realtime panel remains 250px wide, bottom-left anchored, and renders a 45px submission row;
- desktop ranklist content is offset so the panel does not cover the table;
- mobile realtime panel fits inside the viewport and keeps the emitted row visible;
- mobile live progress labels fit inside the viewport instead of clipping the right-side remaining time;
- the internal status marker remains hidden while still carrying status text.

## Non-Goals

This slice does not attempt pixel-perfect React Toastify parity, animation parity, or browser screenshot snapshot matching. Remaining differences such as exact Toastify transition timing should be treated as product enhancements unless they cause visible breakage.

## Implementation Note

The visual review exposed a mobile-only issue outside the realtime panel itself: the renderer package progress labels use 180px minimum widths, causing the right-side `Remaining` label to overflow a 390px viewport. The fix is a scoped mobile `:deep` override in `RanklandRanklist` that allows the progress secondary labels to shrink and wrap inside the viewport.

## Test Strategy

Extend `tests/e2e/full-chain/live.spec.ts` with a visual-layout full-chain test that:

1. opens `/live/live-test-key?token=t0&scrollSolution=1&focus=yes`;
2. emits one deterministic realtime solution through the existing WebSocket stub;
3. reads bounding boxes for the panel, first item, and ranklist content;
4. checks desktop geometry and attaches a desktop screenshot;
5. resizes to a mobile viewport, checks the panel still fits and the row remains visible, and attaches a mobile screenshot.

## Acceptance Criteria

- The visual-layout full-chain test passes and produces desktop/mobile screenshot attachments.
- The mobile progress remaining-time label stays inside the viewport.
- `docs/migration/status.md` records this visual review coverage.
- Remaining live realtime visual differences are either covered by tests or left as explicit product-enhancement risk.
