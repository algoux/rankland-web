# Collection State Wrapper DOM Parity Design

## Context

The old React collection route renders collection-level NotFound, generic error, and loading states with a plain state wrapper:

```tsx
<div className="pt-16 text-center">...</div>
```

The selected-ranklist error/loading states inside the loaded collection panel use the same wrapper. Loading keeps `<Spin />` as a child. The current Vue route keeps the visible state spacing, but collection-level NotFound/error still render as `section.collection-state.pt-16.text-center`, selected-ranklist error still carries `collection-state`, and both loading states render an Ant Design Vue Spin root carrying the state classes.

## Goal

Restore the old collection route state wrapper DOM contract:

- `[data-id="collection-not-found"]`, `[data-id="collection-error"]`, `[data-id="collection-loading"]`, `[data-id="collection-ranklist-error"]`, and `[data-id="collection-ranklist-loading"]` render as plain `DIV` wrappers.
- Each wrapper class list is exactly `pt-16 text-center`.
- The Vue-only `collection-state` class is not emitted.
- Loading keeps an Ant Design Vue Spin inside the wrapper instead of making Spin the wrapper root.
- Existing collection NotFound mapping, generic error copy, refresh behavior, loaded collection layout, selected ranklist switching behavior, and SRK renderer behavior remain unchanged.

## Non-Goals

- Do not change collection loaded wrapper, nav, hidden header, or selected ranklist content DOM.
- Do not change empty-state DOM; old React already renders `data-id="collection-empty-state"` on a plain wrapper with the `pt-16 text-center` class on the `h3`.
- Do not change RanklandApiService error mapping or collection tree behavior.

## Test Strategy

Extend collection full-chain NotFound, collection error, and selected-ranklist error tests with a helper that verifies tag name and exact class list. Update collection loading source guards to require the old wrapper + child Spin contract for both collection-level loading and selected-ranklist switching loading, and require absence of `.collection-state`.

Focused RED should fail because current Vue emits `SECTION.collection-state...` for collection-level NotFound/error, `DIV.collection-state...` for selected-ranklist error, and `a-spin` roots for loading. Focused GREEN should pass after restoring the plain `DIV` wrappers.

## Acceptance Criteria

- Focused collection NotFound/error/selected-ranklist-error full-chain tests pass.
- Focused collection loading unit tests pass.
- A focused collection desktop/mobile bounds test passes.
- The full migration gate passes.
- Migration status, manual acceptance checklist, and final integration review mention the restored collection state wrapper DOM contract.
