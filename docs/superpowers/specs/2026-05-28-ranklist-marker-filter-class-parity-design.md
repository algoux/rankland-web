# Ranklist Marker Filter Class Parity Design

## Context

The old React `StyledRanklistRenderer` renders the marker filter Radio.Group as:

```tsx
<Radio.Group
  className="ml-5 inline-flex items-center"
  onChange={handleMarkerFilterChange}
  value={filter.marker}
>
```

The migrated Vue component already preserves the marker Radio.Group direct-child position, Ant Design Vue behavior, utility class tokens, and computed 20px left spacing. It still exposes a Vue-only product class:

```vue
<a-radio-group
  data-id="rankland-ranklist-marker-filter"
  class="rankland-ranklist-marker-filter ml-5 inline-flex items-center"
>
```

The stable migrated `data-id` can carry tests and scoped styles. The old public renderer contract should not expose `.rankland-ranklist-marker-filter` as a product class.

## Goal

Restore old React marker Radio.Group class parity while preserving the stable `data-id`, Ant Design Vue marker filtering behavior, computed spacing/layout, and mobile layout.

## Scope

- Remove `.rankland-ranklist-marker-filter` from the marker Radio.Group rendered class list.
- Keep `ml-5 inline-flex items-center` on the marker Radio.Group.
- Preserve marker computed `display`, alignment, 20px left margin, and nowrap behavior through a stable `data-id` style selector.
- Extend full-chain assertions to reject the Vue-only marker product class.

## Non-Goals

- Do not remove stable `data-id` selectors.
- Do not change marker option rendering, filter behavior, selected marker state, organization Select, official Switch, progress, table, footer, or modals.
- Do not remove the official wrapper `.rankland-ranklist-checkbox` hook in this slice.
- Do not hand-edit generated router output.

## Test Strategy

Focused RED:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls and preserves filtering behavior"
```

Expected initial failure: current Vue reports `rankland-ranklist-marker-filter` in the marker Radio.Group class list.

Focused GREEN: the same command passes after removing the Vue-only class and preserving layout through the `data-id` style rule.

Ranklist regression:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Full migration gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- Marker Radio.Group class list contains `ml-5`, `inline-flex`, and `items-center`.
- Marker Radio.Group class list does not contain `.rankland-ranklist-marker-filter`.
- Marker computed left margin remains `20px`.
- Marker filtering behavior remains green.
- Mobile filter controls layout remains green.
- Migration status and final review record the verified slice and gate evidence.
