# SRK Route Content Spacing Parity Design

## Context

The old React SRK route pages apply Tailwind spacing utilities to the route-level containers that hold the rendered ranklist:

- `/ranklist/:id`: `className="mt-8 mb-8"` on `data-id="ranklist-content"`.
- `/live/:id`: `className="mt-8 mb-8"` on `data-id="live-ranklist-content"`.
- `/collection/:id`: `className="pb-8"` on `data-id="collection-ranklist-content"` for the selected ranklist.

Tailwind `8` maps to `2rem`, which is `32px` with the default root font size. The current Vue route containers carry the same stable `data-id` values but do not preserve these computed route-level margins/padding.

## Goal

Restore old route-level SRK content spacing for standalone ranklist, live ranklist, and selected collection ranklist containers.

## Scope

- Add full-chain assertions for:
  - `/ranklist/:id` content `margin-top: 32px` and `margin-bottom: 32px`.
  - `/live/:id` content `margin-top: 32px` and `margin-bottom: 32px`.
  - `/collection/:id` selected ranklist content `padding-bottom: 32px`.
- Add route-scoped CSS/classes that preserve the existing stable `data-id` selectors and restore only those spacing values.
- Do not change SRK renderer internals, table wrapper offsets, filters, progress behavior, collection nav layout, live scroll-solution positioning, or app shell spacing.

## Tests

- Extend `tests/e2e/full-chain/ranklist.spec.ts` to read computed styles for `[data-id="ranklist-content"]`.
- Extend `tests/e2e/full-chain/live.spec.ts` to read computed styles for `[data-id="live-ranklist-content"]`.
- Extend `tests/e2e/full-chain/collection.spec.ts` to read computed styles for `[data-id="collection-ranklist-content"]`.
- Run focused ranklist/live/collection full-chain specs before implementation and confirm they fail on missing old spacing.

## Acceptance

- Focused ranklist/live/collection full-chain specs fail before implementation and pass after implementation.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before the slice is reported as verified.
- `docs/migration/status.md` records SRK route content spacing parity and the updated full-gate evidence.
