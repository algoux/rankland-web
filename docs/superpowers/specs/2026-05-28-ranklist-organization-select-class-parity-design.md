# Ranklist Organization Select Class Parity Design

## Context

The old React `StyledRanklistRenderer` renders the organization filter Select as:

```tsx
<Select
  mode="multiple"
  allowClear
  placeholder="选择组织/单位"
  className="ml-2"
  style={{ width: '160px' }}
/>
```

After the filter controls DOM/root slices, the migrated Vue component still renders the Select root with a Vue-only product class and moves the old inline width into component CSS:

```vue
<a-select
  data-id="rankland-ranklist-organization-filter"
  class="rankland-ranklist-select ml-2"
/>
```

```less
.rankland-ranklist-select {
  width: 160px;
}
```

The old public renderer contract is a Select root with the `ml-2` utility class and inline `width: 160px`, not a `rankland-ranklist-select` product class.

## Goal

Restore old React organization Select class/width parity while preserving the stable migrated `data-id`, Ant Design Vue Select behavior, selected-tag behavior, unique organization options, and computed spacing.

## Scope

- Remove `.rankland-ranklist-select` from `[data-id="rankland-ranklist-organization-filter"]`.
- Keep `ml-2` on the Select root.
- Restore inline `style="width: 160px"` on the Select root.
- Preserve the computed 8px left margin for `ml-2` with a stable `data-id`-scoped style rule.
- Extend full-chain assertions to reject the Vue-only class and verify inline width.

## Non-Goals

- Do not remove stable `data-id` selectors.
- Do not change organization filter behavior, compact selected-tag behavior, option uniqueness, or hydration-safe filter reload behavior.
- Do not change official Switch, marker Radio.Group, progress, table, footer, modals, or route state behavior.
- Do not hand-edit generated router output.

## Test Strategy

Focused RED:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls and preserves filtering behavior"
```

Expected initial failure: current Vue reports `rankland-ranklist-select` in the organization Select class list and an empty inline width instead of `160px`.

Focused GREEN: the same command passes after moving width inline and replacing class-based spacing with a `data-id` selector.

Ranklist regression:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Full migration gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- Organization Select root class list contains `ml-2`.
- Organization Select root class list does not contain `.rankland-ranklist-select`.
- Organization Select root has inline width `160px`.
- Computed Select width remains `160px`.
- Computed Select left margin remains `8px`.
- Existing filter interactions, mobile layout, selected tag behavior, and Ranklist full-chain behavior remain green.
