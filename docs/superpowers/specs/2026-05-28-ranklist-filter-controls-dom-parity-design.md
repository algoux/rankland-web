# Ranklist Filter Controls DOM Parity Design

## Context

The old React `StyledRanklistRenderer` renders filter controls directly under the filters block:

```tsx
<div>
  <span>筛选</span>
  <Select className="ml-2" style={{ width: '160px' }} />
  <span className="ml-5 inline-flex items-center">
    <span className="mr-1">仅正式参赛</span>
    <Switch size="small" />
  </span>
  <Radio.Group className="ml-5 inline-flex items-center" />
</div>
```

The migrated Vue wrapper currently inserts Vue-only `label` wrappers:

```vue
<label class="rankland-ranklist-filter">
  <span>筛选</span>
  <a-select ... />
</label>

<label class="rankland-ranklist-filter rankland-ranklist-checkbox ml-5 inline-flex items-center">
  <span class="mr-1">仅正式参赛</span>
  <a-switch ... />
</label>
```

Previous slices restored spacing and mobile layout, but the product DOM still differs from old React. The extra labels and `.rankland-ranklist-filter` product class are not part of the old public renderer contract.

## Goal

Restore the old React filter-control DOM structure while preserving Ant Design Vue controls, stable data hooks, utility spacing, and filtering behavior.

## Scope

- Make `[data-id="rankland-ranklist-filters"]` direct children match old React ordering: text `SPAN`, Select root, official wrapper `SPAN`, Radio.Group root.
- Remove the organization `label.rankland-ranklist-filter` wrapper.
- Change the official wrapper from `label.rankland-ranklist-filter...` to old-style `span.ml-5.inline-flex.items-center`.
- Keep a stable migrated hook on the official wrapper only if needed for tests/styles, but do not keep `.rankland-ranklist-filter`.
- Keep Select `ml-2` and local 8px margin.
- Keep official text `mr-1` and local 4px margin.
- Keep official and marker 20px left margins.
- Preserve desktop/mobile filter behavior, selected-tag behavior, official-only behavior, marker filtering, and viewport guards.

## Non-Goals

- Do not remove stable `data-id` selectors from Ant Design Vue controls.
- Do not rewrite Ant Design Vue Select/Switch/Radio internals.
- Do not alter progress bar, table, modals, footer, route state behavior, or low-level SRK table rendering.
- Do not change the just-restored mobile row layout or inner spacing.
- Do not hand-edit generated router outputs.

## Test Strategy

Use `tests/e2e/full-chain/ranklist.spec.ts` because this is hydrated product DOM behavior involving Ant Design Vue component roots.

Focused RED:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls and preserves filtering behavior"
```

Expected initial failure: current Vue reports `LABEL` wrappers under the filter block and keeps `.rankland-ranklist-filter` on the official wrapper.

Focused GREEN: the same command passes after removing the Vue-only label wrappers.

Ranklist regression:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Full gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- Filters root direct children begin with `SPAN`, organization Select root, official wrapper `SPAN`, marker Radio.Group root.
- Organization Select parent is the filters root, not a label.
- Official wrapper is a `SPAN`, not a label.
- Official wrapper no longer has `.rankland-ranklist-filter`.
- Existing utility classes and computed spacing remain green.
- Existing filter interactions and Ranklist full-chain behavior remain green.
- Migration status and final review record the verified slice and gate evidence.
