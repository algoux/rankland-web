# Ranklist Filters Root Class Parity Design

## Context

The old React `StyledRanklistRenderer` renders the optional SRK filter controls inside a plain wrapper:

```tsx
{showFilter && (
  <div>
    <span>筛选</span>
    <Select className="ml-2" style={{ width: '160px' }} />
    <span className="ml-5 inline-flex items-center">...</span>
    <Radio.Group className="ml-5 inline-flex items-center" />
  </div>
)}
```

The migrated Vue component has already restored the direct child structure, spacing, and mobile layout. The filters root still carries a Vue-only product class:

```vue
<div data-id="rankland-ranklist-filters" class="rankland-ranklist-filters">
```

That class is not part of the old React DOM contract. Styling can be anchored to the stable migrated `data-id` without exposing an additional product class.

## Goal

Restore the SRK filters root to an old-style plain `div` class contract while preserving the stable `data-id`, computed flex layout, filter behavior, and existing child-control parity.

## Scope

- Remove `.rankland-ranklist-filters` from the filters root rendered class list.
- Keep `[data-id="rankland-ranklist-filters"]` as the stable E2E/style hook.
- Move the root flex/flex-wrap/align-items/gap style rule to the `data-id` selector.
- Extend the existing full-chain DOM parity helper to assert the root class list is empty.
- Preserve direct child ordering, utility classes, spacing, desktop behavior, and mobile filter layout.

## Non-Goals

- Do not remove stable `data-id` hooks from migrated controls.
- Do not change Select, Switch, Radio.Group, progress bar, modal, footer, or table rendering.
- Do not alter the just-restored child-control DOM, spacing, or mobile wrapping behavior.
- Do not hand-edit generated router output.

## Test Strategy

Focused RED:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls and preserves filtering behavior"
```

Expected initial failure: the helper reports `filtersClasses: ["rankland-ranklist-filters"]` instead of an empty class list.

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

- `[data-id="rankland-ranklist-filters"]` renders with an empty `classList`.
- Existing filters direct child DOM parity remains green.
- Root computed layout remains `display: flex`, wrapping enabled, aligned center, and zero gap.
- Mobile filter layout regression remains green.
- Migration status and final review record the verified slice and gate evidence.
