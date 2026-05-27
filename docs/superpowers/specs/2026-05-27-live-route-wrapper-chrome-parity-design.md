# Live Route Wrapper Chrome Parity Design

## Context

Old React `rankland-fe/src/pages/live/[id].tsx` renders the loaded live ranklist inside:

```tsx
<div
  className="mt-8 mb-8"
  style={{ marginLeft: enabledScrollSolution ? '250px' : undefined }}
  data-id="live-ranklist-content"
>
```

That wrapper has no route-level page padding, no width cap, and no auto-centering. When scroll-solution is enabled, the only layout offset is the old `250px` left margin that leaves space for the fixed Toastify column.

The migrated Vue route currently adds Vue-only chrome:

- `.live-page { padding: 24px 16px; min-height: 70vh; }`
- `.live-content { max-width: 1280px; margin-left: auto; margin-right: auto; }`
- `.live-content-with-scroll-solution { margin-left: 250px; margin-right: 16px; }`

This narrows and shifts the live page compared with old React, especially on wide screens and on the first visible row below the app shell.

## Goal

Restore old live route wrapper chrome for loaded ranklists: keep the old `32px` top/bottom margins and the scroll-solution `250px` left offset, but remove Vue-only route padding, max-width capping, auto-centering, and extra right margin.

## Scope

- Update `src/client/modules/live/live.view.vue` scoped CSS only.
- Preserve existing hidden hydration marker, loading/error/NotFound behavior, WebSocket reconnect, Toastify layout, scroll-solution toggle, SRK wrapper, and mobile no-overflow guard.
- Add full-chain coverage in `tests/e2e/full-chain/live.spec.ts` for the loaded live route wrapper CSS contract.

## Non-Goals

- Do not change ranklist, collection, playground, or app shell wrappers.
- Do not alter scroll-solution queueing, protobuf parsing, result labels, delays, animation, or connection behavior.
- Do not remove existing viewport overflow checks.

## Test Strategy

Add a focused full-chain assertion because the behavior is public route chrome:

- RED: loaded `/live/:id?token=t0&scrollSolution=1&focus=yes` should report `.live-page` padding `0px`, content `max-width: none`, content `margin-left: 250px`, and content `margin-right: 0px`. Current Vue should fail because the page padding is `24px 16px`, max-width is `1280px`, and margin-right is `16px`.
- GREEN: remove the Vue-only CSS while preserving the old `32px` top/bottom content margin and mobile bounds.
- Full gate remains `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.

## Acceptance Criteria

- Loaded live content has no route-level page padding.
- Loaded live content has no `1280px` max-width cap or auto-centering.
- Scroll-solution live content keeps the old `250px` left margin and no extra right margin.
- Existing mobile live viewport and no-horizontal-overflow checks still pass.
- Migration docs record the verified slice.
