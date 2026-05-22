# Live Mobile Toggle Parity Design

## Goal

Align the migrated `/live/:id` page with the old React page by hiding the scroll-solution toggle from the ranklist action area on mobile viewports while preserving desktop behavior and query-driven scroll-solution rendering.

## Source Behavior

The old React live page computes `clientWidth` with `useClientWidthHeight()` and returns `null` from `renderExtraActionArea()` when `clientWidth < 768`. This means the "实时滚动提交状态" switch is not visible on mobile, but an already-enabled `scrollSolution=1` query still controls the WebSocket and `ScrollSolution` component.

## Target Behavior

The Vue page should:

- keep the existing desktop toggle visible at widths `>= 768px`;
- hide the toggle at widths below `768px`;
- keep `scrollSolution=1` query behavior unchanged, including WebSocket setup and scroll-solution panel rendering;
- avoid introducing browser-only width reads into SSR-sensitive code. `/live/:id` is CSR, but CSS-only visibility is enough and keeps the component simple.

## Non-Goals

This slice does not add a new mobile control for enabling scroll solutions, change WebSocket reconnect policy, redesign the live page, or change ranklist filtering/export/share behavior.

## Test Strategy

Add a focused full-chain Playwright assertion for a mobile viewport:

- open `/live/live-test-key?token=t0&focus=yes` at `390x844`;
- verify the live ranklist still hydrates and renders fixture rows;
- verify `[data-id="live-scroll-solution-toggle"]` is hidden;
- verify the scroll-solution panel is not present when `scrollSolution=1` is absent.

Keep the existing desktop full-chain test as the proof that the toggle remains visible and checked when `scrollSolution=1` is present.

## Acceptance Criteria

- Mobile live page no longer exposes the scroll-solution toggle in the action area.
- Desktop live page behavior remains covered by the existing full-chain test.
- No generated router files are touched.
- `docs/migration/status.md` records this verified parity slice and keeps reconnect policy as remaining live review work.
