# Ranklist State Wrapper DOM Parity Design

## Context

The old React ranklist route renders NotFound, generic error, and loading states with a plain state wrapper:

```tsx
<div className="mt-16 text-center">...</div>
```

For loading, the old wrapper contains `<Spin />` as a child. The current Vue route keeps the visible spacing, but NotFound/error still render as `section.ranklist-state.mt-16.text-center` and loading renders as an Ant Design Vue Spin root carrying the state classes.

## Goal

Restore the old ranklist route state wrapper DOM contract:

- `[data-id="ranklist-not-found"]`, `[data-id="ranklist-error"]`, and `[data-id="ranklist-loading"]` render as plain `DIV` wrappers.
- Each wrapper class list is exactly `mt-16 text-center`.
- The Vue-only `ranklist-state` class is not emitted.
- Loading keeps an Ant Design Vue Spin inside the wrapper instead of making Spin the wrapper root.
- Existing titles, NotFound mapping, generic error copy, refresh behavior, loaded ranklist SSR/hydration, and SRK renderer behavior remain unchanged.

## Non-Goals

- Do not change collection state wrappers in this slice.
- Do not change loaded ranklist content or SRK renderer behavior.
- Do not change RanklandApiService error mapping.

## Test Strategy

Extend ranklist full-chain NotFound/error tests with a helper that verifies tag name and exact class list. Update the existing ranklist loading source guard to require the old wrapper + child Spin contract and absence of `.ranklist-state`.

Focused RED should fail because current Vue emits `SECTION.ranklist-state...` for NotFound/error and an `a-spin` root for loading. Focused GREEN should pass after restoring the plain `DIV` wrappers.

## Acceptance Criteria

- Focused ranklist NotFound/error full-chain tests pass.
- Focused ranklist loading unit test passes.
- A focused ranklist desktop/mobile bounds test passes.
- The full migration gate passes.
- Migration status, manual acceptance checklist, and final integration review mention the restored ranklist state wrapper DOM contract.
