# Route State Utility Class Parity Design

## Context

Old React route states render Tailwind-style utility class tokens directly on their DOM:

- `/ranklist/:id` NotFound, generic error, and loading wrappers use `mt-16 text-center`; the NotFound heading uses `h3.mb-4`.
- `/live/:id` NotFound, generic error, and loading wrappers use `mt-16 text-center`; the NotFound heading uses `h3.mb-4`.
- `/collection/:id` collection-level NotFound, generic error, loading, selected-ranklist error, and selected-ranklist loading wrappers use `pt-16 text-center`; the NotFound heading uses `h3.mb-4`.

The Vue migration currently preserves visible spacing through route-local state classes such as `ranklist-state`, `live-state`, and `collection-state`, but those old utility class tokens are not present in the rendered DOM. This leaves route-level DOM/class parity weaker than already-restored content wrappers such as `mt-8 mb-8`, Playground `h3.mt-16.text-center`, and SRK wrapper utility classes.

## Decision

Restore the old utility class tokens on the migrated state DOM while retaining existing stable migration hooks and `data-id` selectors:

- Add `mt-16 text-center` to ranklist and live state wrappers/spinners.
- Add `pt-16 text-center` to collection state wrappers/spinners.
- Add `mb-4` to ranklist/live/collection NotFound headings.
- Keep `ranklist-state`, `live-state`, and `collection-state` classes so existing route tests and selectors remain stable.

## Non-Goals

- Do not redesign state screens.
- Do not change route error mapping or upstream API behavior.
- Do not remove existing stable `data-id` selectors.
- Do not broaden this slice into SRK lower-level table pixel parity.

## Test Strategy

- Full-chain route tests assert the old utility class tokens on NotFound wrappers/headings and generic error wrappers for ranklist, live, and collection.
- Loading-state unit tests assert the source templates carry the old utility class tokens on Ant Design Vue spinner states.
- RED should fail before implementation because the state DOM currently only carries migrated route-local classes.
- GREEN should pass after adding old utility tokens while existing computed-style and Ant Design action assertions remain unchanged.

## Acceptance Criteria

- Ranklist NotFound/error/loading route states carry `mt-16 text-center`; Ranklist NotFound `h3` carries `mb-4`.
- Live NotFound/error/loading route states carry `mt-16 text-center`; Live NotFound `h3` carries `mb-4`.
- Collection collection-level NotFound/error/loading and selected-ranklist error/loading states carry `pt-16 text-center`; Collection NotFound `h3` carries `mb-4`.
- Existing Ant Design Vue primary small actions, copy, page titles, and request-count assertions continue to pass.
- Migration status, manual checklist, and final integration review record this route polish slice.
