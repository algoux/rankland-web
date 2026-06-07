# Ranklist Official Filter Class Parity Design

## Context

The old React `StyledRanklistRenderer` renders the official-only filter wrapper as:

```tsx
<span className="ml-5 inline-flex items-center">
  <span className="mr-1">仅正式参赛</span>
  <Switch checked={filter.officialOnly} size="small" />
</span>
```

The migrated Vue component has already restored the wrapper tag, direct-child position, Ant Design Vue Switch, utility class tokens, and computed spacing. It still exposes a Vue-only product class:

```vue
<span class="rankland-ranklist-checkbox ml-5 inline-flex items-center">
```

Tests and local styles can locate the wrapper through the stable child `[data-id="rankland-ranklist-official-filter"]` and its parent `span`. The old public renderer contract should not expose `.rankland-ranklist-checkbox`.

## Goal

Restore old React official-only wrapper class parity while preserving the stable official Switch `data-id`, Ant Design Vue Switch behavior, computed spacing/layout, and mobile layout.

## Scope

- Remove `.rankland-ranklist-checkbox` from the official-only wrapper rendered class list.
- Keep `ml-5 inline-flex items-center` on the wrapper.
- Keep official label `mr-1`.
- Preserve wrapper 20px left margin and 4px label-to-switch spacing through old utility classes scoped to the local wrapper shape.
- Update E2E helpers to resolve the official wrapper via `officialFilter.parentElement`, not via `.rankland-ranklist-checkbox`.
- Extend full-chain assertions to reject the Vue-only official wrapper class.

## Non-Goals

- Do not remove stable `data-id` selectors.
- Do not change official-only filtering behavior, Switch props, organization Select, marker Radio.Group, progress, table, footer, or modals.
- Do not remove unrelated migrated hooks.
- Do not hand-edit generated router output.

## Test Strategy

Focused RED:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls and preserves filtering behavior"
```

Expected initial failure: current Vue reports `rankland-ranklist-checkbox` in the official wrapper class list.

Focused GREEN: the same command passes after removing the Vue-only class and preserving spacing through local utility-style selectors.

Ranklist regression:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Full migration gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- Official wrapper tag remains `SPAN`.
- Official wrapper class list contains `ml-5`, `inline-flex`, and `items-center`.
- Official wrapper class list does not contain `.rankland-ranklist-checkbox`.
- Official computed left margin remains `20px`.
- Official label-to-Switch visual gap remains `4px`.
- Official-only filtering behavior remains green.
- Mobile filter controls layout remains green.
- Migration status and final review record the verified slice and gate evidence.
