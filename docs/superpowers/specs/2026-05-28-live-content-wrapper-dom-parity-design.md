# Live Content Wrapper DOM Parity Design

## Context

The old React Live route renders the loaded ranklist content as a plain `div` with only the old spacing utility classes and an inline scroll-solution offset:

```tsx
<div
  className="mt-8 mb-8"
  style={{ marginLeft: enabledScrollSolution ? '250px' : undefined }}
  data-id="live-ranklist-content"
  data-ranklist-id={key}
  data-row-count={String(ranklist.rows.length)}
>
```

The migrated Vue route already restores the loaded page root to a plain `DIV`, removes the route-local `live-page` class/min-height, preserves the old `mt-8 mb-8` spacing, and preserves the `250px` scroll-solution offset. It still renders the loaded content as:

```vue
<section
  data-id="live-ranklist-content"
  class="live-content mt-8 mb-8"
  :class="{ 'live-content-with-scroll-solution': scrollSolutionEnabled }"
>
```

That keeps extra Vue-only product classes and uses a CSS class rather than the old inline style for the scroll-solution offset.

## Goal

Restore the old React `/live/:id` loaded content wrapper DOM contract while preserving the existing Live data flow, polling, WebSocket lifecycle, scroll-solution behavior, and SRK rendering.

## Scope

- Change the loaded content wrapper from `section` to `div`.
- Keep `data-id="live-ranklist-content"` and existing route data attributes.
- Make the loaded content class list exactly `mt-8 mb-8`.
- Remove Vue-only `live-content` and `live-content-with-scroll-solution` product classes.
- Move the scroll-solution `250px` left offset to inline style, matching old React.
- Retain computed `margin-left: 250px` when `scrollSolution=1`.
- Keep mobile scroll-solution toggle no-DOM behavior and viewport bounds behavior.
- Preserve old React's `250px` content offset on mobile when `scrollSolution=1`; the old page does not reset that inline `marginLeft` below 768px.

## Non-Goals

- Do not change Live async data, polling, WebSocket reconnect/backoff, Toastify ordering, query preservation, or scroll-solution state handling.
- Do not change shared `RanklandRanklist` / SRK renderer internals.
- Do not change NotFound, loading, or error state wrappers.
- Do not hand-edit generated router outputs.

## Test Strategy

Use `tests/e2e/full-chain/live.spec.ts` because this is public route DOM/style parity that depends on CSR hydration, mock backend data, and stubbed WebSocket behavior.

Focused RED:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page"
```

Expected initial failure: current Vue returns `contentTagName: "SECTION"` and content classes include `live-content` and `live-content-with-scroll-solution` instead of exact `mt-8 mb-8`.

Focused GREEN: the same command passes after the template and route-local CSS changes.

Full gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- `[data-id="live-ranklist-content"]` is a `DIV`.
- `[data-id="live-ranklist-content"]` has exact class list `mt-8 mb-8`.
- The wrapper has no Vue-only `live-content` or `live-content-with-scroll-solution` product class.
- With `scrollSolution=1`, the wrapper still computes `margin-left: 250px` and `margin-right: 0px`, including after switching to a mobile viewport.
- Existing Live full-chain behavior remains green.
- Migration status, manual checklist, and final integration review record the verified slice and gate evidence.
