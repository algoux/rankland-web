# Fallback 404 Class Token Parity Design

## Context

The old React fallback page renders:

```tsx
<div className="text-center mt-32 text-xl">404 Not Found · 你来到了榜单荒地</div>
```

The Vue migration already restores the visible copy, HTTP 404 status, and computed spacing/typography, but the DOM still carries the migration-only `fallback-not-found` class. Product-level parity work has been moving from computed-only equivalence to old DOM/class-token equivalence where feasible.

## Decision

Restore the old class-token contract on the fallback 404 element:

- Keep `data-id="fallback-not-found"` as the stable full-chain selector.
- Replace the migration-only class with exact old class tokens: `text-center mt-32 text-xl`.
- Preserve computed style parity: 128px top margin, 20px font size, 28px line height, and centered text.
- Do not change fallback route matching, HTTP status behavior, app shell visibility, or document title behavior.

## Test Strategy

Update the existing full-chain app-shell fallback test to assert exact class tokens in addition to copy, HTTP status, and computed styles.

Expected TDD behavior:

- RED: current Vue DOM has `fallback-not-found`, not `text-center mt-32 text-xl`.
- GREEN: fallback DOM has the old exact class string and the existing computed style assertions still pass.

## Acceptance Criteria

- Unknown public routes still return HTTP 404.
- Fallback copy remains unchanged.
- Fallback element class is exactly `text-center mt-32 text-xl`.
- Existing computed spacing/typography assertions remain green.
- Migration status, manual checklist, and final integration review record the slice.
