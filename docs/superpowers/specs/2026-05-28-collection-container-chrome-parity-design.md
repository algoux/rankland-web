# Collection Container Chrome Parity Design

## Context

The old React collection page renders the loaded collection body as:

```tsx
<div className="srk-collection-container">
```

Its Less file only scopes child rules under `.srk-collection-container`; the container itself does not set `position` or `min-height`.

The Vue migration currently keeps the old class but adds container-level chrome:

```css
.srk-collection-container {
  position: relative;
  min-height: 70vh;
}
```

This adds a Vue-only page shell behavior to the legacy collection root. The route already has focused coverage for the old nav, hidden header, selected ranklist panel, and remaining-height contract, so this slice removes only the root chrome.

## Scope

- Preserve `data-id="collection-content"` and `class="srk-collection-container"`.
- Remove Vue-only `position: relative` and `min-height: 70vh` from `.srk-collection-container`.
- Preserve the fixed nav, sticky hidden header, ranklist panel, selected ranklist content, mobile collapse, and remaining-height behavior.
- Record focused RED/GREEN and full migration gate evidence in migration docs.

## Non-Goals

- Do not change collection nav width, height, transition, or collapse persistence.
- Do not change Ant Design Vue menu rendering.
- Do not change selected ranklist loading, error, or empty states.
- Do not change SRK renderer internals.

## Test Strategy

Extend the existing `/collection/:id` full-chain happy-path test:

- Assert `[data-id="collection-content"]` still renders the old `srk-collection-container` class.
- Assert its computed `position` is `static`.
- Assert its computed `min-height` is `0px`.
- Keep the existing loaded wrapper, nav, hidden header, ranklist panel, and selected-ranklist assertions.

## Acceptance Criteria

- The focused collection full-chain happy path fails before implementation because the Vue container computes `position: relative` and `min-height: 70vh`.
- After implementation, the focused test passes with `position: static` and `min-height: 0px`.
- The full collection full-chain file passes.
- The full migration gate passes: `gen:client-router`, `test:migration`, and `git diff --check`.
- Migration status and acceptance docs record the slice and remaining next focus.
