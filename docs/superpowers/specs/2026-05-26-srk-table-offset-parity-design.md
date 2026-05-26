# SRK Table Offset Parity Design

## Context

The old React route callers apply `tableClass="ml-4"` for standalone ranklist and live pages:

- `rankland-fe/src/pages/ranklist/[id].tsx`
- `rankland-fe/src/pages/live/[id].tsx`

The old collection and playground callers do not pass this table class. Inside `StyledRanklistRenderer`, `tableClass` is applied to the direct wrapper around remarks, table, user modal, and solution modal.

In the Vue migration, `/ranklist/:id` and `/live/:id` pass route-specific class names (`ranklist-detail-table`, `live-ranklist-table`) that have no matching CSS. This drops the old 16px left table offset and leaves the SRK table wrapper at `margin-left: 0`.

## Goal

Restore old `tableClass="ml-4"` behavior for standalone ranklist and live pages while keeping collection and playground preview unshifted.

## Scope

- Add a stable `data-id="rankland-ranklist-table-wrapper"` to the shared wrapper div that receives `tableClass`.
- Implement scoped `ml-4` class behavior in `rankland-ranklist.vue` with `margin-left: 16px`.
- Change `/ranklist/:id` and `/live/:id` callers to pass `table-class="ml-4"`.
- Do not pass `ml-4` from collection or playground.
- Add full-chain browser assertions for computed table-wrapper margin-left:
  - ranklist: `16px`;
  - live: `16px`;
  - collection selected ranklist: `0px`.

## Non-Goals

- Do not change the underlying SRK renderer package.
- Do not adjust table column widths, row heights, rank colors, problem-cell styling, or modal layout in this slice.
- Do not change export/share/filter/progress behavior.
- Do not change route data loading or API contracts.

## Tests

- Extend `tests/e2e/full-chain/ranklist.spec.ts` to assert the shared table wrapper has computed `margin-left: 16px`.
- Extend `tests/e2e/full-chain/live.spec.ts` to assert the same on live pages.
- Extend `tests/e2e/full-chain/collection.spec.ts` to assert selected collection ranklists keep computed `margin-left: 0px`.

## Acceptance

- Focused ranklist/live/collection full-chain specs fail before implementation and pass after implementation.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before the slice is reported as verified.
- `docs/migration/status.md` records SRK table-wrapper offset parity.
