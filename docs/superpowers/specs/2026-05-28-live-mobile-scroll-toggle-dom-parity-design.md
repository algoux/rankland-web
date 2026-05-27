# Live Mobile Scroll Toggle DOM Parity Design

## Context

The old React `/live/:id` route passes a `renderExtraActionArea` function to `StyledRanklist`. That function checks `clientWidth < 768` and returns `null` on mobile. As a result, the old mobile product DOM does not contain the scroll-solution `Switch` or its `.inline-flex.items-center` wrapper.

The Vue route currently always renders the scroll-solution toggle markup and hides it on mobile with CSS. That preserves the visual result, but it leaves mobile-only product DOM that the old React route did not render.

## Goal

Restore the old React mobile DOM contract: live scroll-solution toggle markup is not rendered below `768px`, while desktop keeps the existing Ant Design Vue switch behavior and class/style parity.

## Decisions

- Keep the shared `RanklandRanklist` extra-action slot in place; the old React renderer also keeps an empty extra-action container when the render function returns `null`.
- Gate only the Live route toggle label/switch content by viewport width.
- Reuse the existing resize listener path in `live.view.vue` and store `window.innerWidth` in component state.
- Do not change scroll-solution query semantics, WebSocket reconnect behavior, Toastify rows, or SRK table rendering.

## Test Strategy

- Tighten the existing mobile full-chain test to assert that `[data-id="live-scroll-solution-toggle"]` and `.live-scroll-toggle` have count `0`.
- Confirm RED against the current CSS-hidden implementation.
- Add the viewport-width gate in `src/client/modules/live/live.view.vue`.
- Confirm GREEN with the same focused full-chain test.
- Run the full migration gate before committing.

## Acceptance Criteria

- At a `390x844` viewport, `/live/live-test-key?token=t0&focus=yes` renders the live ranklist and does not render scroll-solution toggle DOM.
- Desktop `/live/live-test-key?token=t0&scrollSolution=1&focus=yes` keeps the existing visible Ant Design Vue small switch and old wrapper class/style assertions.
- Existing scroll-solution status and realtime tests remain unchanged.

## Risks

Low risk. The route is CSR and already reads browser viewport metrics for scroll-solution container sizing. The implementation keeps the old desktop path and the existing mobile visual result.
