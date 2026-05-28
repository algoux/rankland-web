# Live State Wrapper DOM Parity Design

## Context

The old React live route renders NotFound, generic error, and loading states with a plain state wrapper:

```tsx
<div className="mt-16 text-center">...</div>
```

For the loading state, the old wrapper contains `<Spin />` as a child. The current Vue route keeps the visible spacing but still renders NotFound/error as `section.live-state.mt-16.text-center` and renders loading as an `a-spin` root carrying the state classes.

## Goal

Restore the old live route state wrapper DOM contract:

- `[data-id="live-not-found"]`, `[data-id="live-error"]`, and `[data-id="live-loading"]` render as plain `DIV` nodes.
- Each wrapper class list is exactly `mt-16 text-center`.
- The Vue-only `live-state` class is not emitted.
- Loading keeps an Ant Design Vue Spin inside the wrapper, instead of making the Spin the wrapper root.
- Existing title, button behavior, request flow, NotFound mapping, generic error copy, and loaded live ranklist behavior remain unchanged.

## Non-Goals

- Do not change ranklist or collection state wrappers in this slice.
- Do not change live WebSocket/reconnect or scroll-solution behavior.
- Do not change the loaded live content wrapper or SRK renderer behavior.

## Test Strategy

Extend the live full-chain state tests with a helper that verifies each state wrapper's tag name and exact class list. Loading also verifies the wrapper contains an Ant Design Spin child and is not itself `.ant-spin`.

Focused RED should fail because current Vue emits `SECTION.live-state...` for NotFound/error and an `a-spin` root for loading. Focused GREEN should pass after restoring the plain `DIV` wrappers.

## Acceptance Criteria

- Focused live loading, NotFound, and generic error full-chain tests pass.
- The full migration gate passes.
- Migration status, manual acceptance checklist, and final integration review mention the restored live state wrapper DOM contract.
