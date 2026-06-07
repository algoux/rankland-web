# Playground Preview Filter Parity Design

## Context

The old React `SrkPlayground` renders valid preview data with:

```tsx
<StyledRanklist data={data} name="playground" showFilter />
```

The Vue playground currently renders:

```vue
<RanklandRanklist :ranklist="parseState.data" />
```

That means the migrated Playground preview misses the old SRK filter row. This became more visible after the shared wrapper's filter controls were restored to Ant Design Vue.

## Goal

Restore old Playground preview behavior by enabling the shared ranklist filter controls and preserving the old preview ranklist name.

## Scope

- Pass `name="playground"` to `RanklandRanklist` from `playground.view.vue`.
- Pass `show-filter` to `RanklandRanklist` from `playground.view.vue`.
- Add full-chain coverage that `/playground` preview displays the shared Ant Design Vue filter controls after Monaco is ready.
- Keep existing Playground editor, welcome modal, invalid JSON, schema diagnostics, theme, and preview parsing behavior unchanged.

## Non-Goals

- Do not add header, progress, footer, export/share actions, or rank-time modal behavior to Playground preview.
- Do not change the bundled demo SRK data.
- Do not change Monaco package versions or synthetic editor editing behavior.
- Do not change the shared `RanklandRanklist` filter implementation in this slice.

## Tests

Extend `tests/e2e/full-chain/playground.spec.ts`:

- in the bundled SRK preview test, assert `[data-id="rankland-ranklist-filters"]` is visible;
- assert `[data-id="rankland-ranklist-organization-filter"]` has Ant Design Vue Select class;
- assert `[data-id="rankland-ranklist-official-filter"]` has Ant Design Vue Switch class.

The bundled demo has no organizations or markers, so the test only verifies the filter row and controls that old `showFilter` always rendered.

## Acceptance

- Focused Playground full-chain spec fails before implementation and passes after implementation.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before the slice is reported as verified.
- `docs/migration/status.md` records Playground preview filter parity.
