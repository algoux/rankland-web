# Route Content Utility Class Parity Design

## Context

Old React uses Tailwind-style utility class tokens on loaded route content wrappers:

```tsx
// rankland-fe/src/pages/ranklist/[id].tsx
<div className="mt-8 mb-8" data-id="ranklist-content" />

// rankland-fe/src/pages/live/[id].tsx
<div className="mt-8 mb-8" data-id="live-ranklist-content" />
```

The migrated Vue routes currently preserve the computed `32px` top/bottom spacing through route-specific classes, but the product DOM no longer exposes the old `mt-8 mb-8` class tokens:

- `src/client/modules/ranklist/ranklist.view.vue`: `class="ranklist-content"`
- `src/client/modules/live/live.view.vue`: `class="live-content"`

Other completed slices have restored legacy utility class tokens where old React exposed them, because downstream style hooks, screenshots, and product DOM parity depend on more than computed pixels.

## Goal

Restore old loaded route content utility class tokens for `/ranklist/:id` and `/live/:id` while preserving existing computed layout, hydration behavior, scroll-solution offset, and mobile bounds.

## Scope

- Add `mt-8 mb-8` class tokens to loaded `ranklist-content` and `live-ranklist-content` wrappers.
- Keep `margin-top` and `margin-bottom` at `32px`.
- Keep live route wrapper chrome from the previous slice: no page padding, no width cap, no auto-centering, and old `250px` scroll-solution left offset.
- Update full-chain tests for DOM class token parity.

## Non-Goals

- Do not change error/loading/NotFound states.
- Do not change collection or playground wrappers in this slice.
- Do not alter SRK renderer internals, filter controls, WebSocket behavior, Toastify, or API loading.

## Test Strategy

Use existing route full-chain tests:

- RED: assert `/ranklist/:id` loaded content has `mt-8` and `mb-8`; current Vue should fail because it only has `ranklist-content`.
- RED: assert `/live/:id` loaded content has `mt-8` and `mb-8`; current Vue should fail because it only has `live-content`.
- GREEN: add the class tokens and keep computed spacing checks unchanged.
- Run focused ranklist/live full-chain tests, then the full migration gate.

## Acceptance Criteria

- `[data-id="ranklist-content"]` contains `ranklist-content mt-8 mb-8`.
- `[data-id="live-ranklist-content"]` contains `live-content mt-8 mb-8`.
- Both wrappers still compute `margin-top: 32px` and `margin-bottom: 32px`.
- Live scroll-solution wrapper still computes old no-padding/no-width-cap/no-auto-centering and `250px` left offset behavior.
- Full migration gate passes and migration docs record the slice.
