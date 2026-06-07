# SRK Filter Controls Parity Design

## Context

The shared Vue `RanklandRanklist` wrapper has restored header metadata, export/share dropdowns, footer, user modal, and G2 rank-time chart parity. The remaining product-review-driven SRK wrapper risk is table/control pixel parity. One concrete gap is the filter control row: old React `StyledRanklistRenderer` uses Ant Design `Select`, `Switch`, and `Radio.Group` with `Radio.Button`; the Vue wrapper still uses native `select`, checkbox, and radio inputs.

The old filter semantics also require `officialOnly` to keep rows whose `row.user?.official === true`. Current Vue filtering only excludes `official === false`, so users with missing `official` are incorrectly kept.

## Goal

Restore the old SRK filter control UI and official-only filtering semantics in the shared Vue ranklist wrapper using Ant Design Vue.

## Scope

- Replace native organization multi-select with `a-select mode="multiple" allow-clear`.
- Replace native official-only checkbox with `a-switch size="small"`.
- Replace native marker radio inputs with `a-radio-group` and `a-radio-button` controls.
- Preserve current `data-id` selectors for full-chain tests:
  - `rankland-ranklist-organization-filter`;
  - `rankland-ranklist-official-filter`;
  - `rankland-ranklist-marker-filter`.
- Preserve existing filter state shape and row/statistics recalculation.
- Align `officialOnly` with old React behavior: only `official === true` rows remain.
- Register any added Ant Design Vue components globally in `src/client/main.ts`.
- Keep the wrapper SSR-safe and avoid changing route APIs.

## Non-Goals

- Do not replace the underlying SRK renderer package.
- Do not change export/share, rank-time chart, progress bar, user modal, or solution modal behavior.
- Do not alter public route data loading or mock API contracts.
- Do not claim full table pixel parity beyond this filter-control slice.

## Tests

- Unit:
  - Extend `tests/unit/rankland-ranklist-state.spec.ts` so `officialOnly` filters out rows where `official` is missing, not only `false`.
- Full-chain:
  - Extend `/ranklist/test-key?focus=yes` coverage to assert the filter row renders Ant Design Vue classes for Select, Switch, and Radio Button group.
  - Select organization `Org A` through the Ant Design dropdown and assert `Team Beta` is hidden.
  - Toggle official-only through the Ant Design switch and assert the missing-official `Team Beta` is hidden.
  - Select `Gold Group` through the Ant Design radio button group and assert `Team Beta` is hidden.

The fixture will include deterministic `gold` and `silver` markers so the marker control is visible in full-chain tests.

## Acceptance

- The new unit and full-chain tests fail before implementation and pass after implementation.
- Focused ranklist full-chain coverage passes.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before the slice is reported as verified.
- `docs/migration/status.md` records SRK filter-control parity and remaining SRK wrapper risks.
