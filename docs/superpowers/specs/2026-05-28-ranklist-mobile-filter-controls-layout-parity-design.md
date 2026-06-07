# Ranklist Mobile Filter Controls Layout Parity Design

## Context

The old React `StyledRanklistRenderer` renders the filter/action controls with the same class and layout contract on all viewport widths:

```tsx
<div className="mt-3 mx-4 flex justify-between items-center">
  {showFilter && (
    <div>
      <span>筛选</span>
      <Select className="ml-2" style={{ width: '160px' }} />
      <span className="ml-5 inline-flex items-center">
        <span className="mr-1">仅正式参赛</span>
        <Switch size="small" />
      </span>
      <Radio.Group className="ml-5 inline-flex items-center" />
    </div>
  )}
  <div>{renderExtraActionArea ? renderExtraActionArea(memorizedData) : null}</div>
</div>
```

The migrated Vue wrapper already preserves the desktop spacing and utility classes, but adds a mobile-only scoped override:

```less
@media (max-width: 767px) {
  .rankland-ranklist-controls {
    align-items: stretch;
    flex-direction: column;
  }

  :global(.rankland-ranklist-filters) {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }

  :global(.rankland-ranklist-checkbox),
  :global(.rankland-ranklist-marker-filter) {
    margin-left: 0;
  }

  .rankland-ranklist-select {
    width: 100%;
  }
}
```

That mobile override is Vue-only product behavior. It changes the old controls row from a stable row layout into a column layout, removes the old `ml-5` visual spacing, and stretches the organization select to the container width.

## Goal

Restore the old React mobile filter-controls layout contract while preserving existing filter behavior and mobile viewport containment.

## Scope

- Keep the controls root old utility class list: `mt-3 mx-4 flex justify-between items-center`.
- Keep mobile computed controls layout as `flex-direction: row` and `align-items: center`.
- Keep the filter group mobile layout as a row, not a column.
- Keep organization select width at `160px` on mobile.
- Keep official and marker filters with `20px` left spacing on mobile.
- Preserve organization filtering, official-only filtering, marker filtering, full-chain mock behavior, and route wrapper viewport guards.

## Non-Goals

- Do not remove the current stable `data-id` test hooks.
- Do not rewrite filter wrappers from labels/divs into exact React child nodes in this slice.
- Do not remove the shared `rankland-ranklist` root wrapper or table overflow protection.
- Do not change SRK table rendering, progress bar mobile behavior, modals, footer, or route loading states.
- Do not hand-edit generated router outputs.

## Test Strategy

Use `tests/e2e/full-chain/ranklist.spec.ts` because this is browser-visible DOM/CSS behavior that depends on the compiled SFC scoped styles, Ant Design Vue controls, and full-chain route hydration.

Focused RED:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls and preserves filtering behavior"
```

Expected initial failure: at a 390px viewport, current Vue reports `controlsFlexDirection: "column"`, filter group `flexDirection: "column"`, organization select `width` stretched to the available mobile width, and official/marker left margins as `0px`.

Focused GREEN: the same command passes after removing only the Vue-only mobile filter-controls override.

Ranklist regression:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Full gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- Desktop filter-control spacing and behavior remain unchanged.
- Mobile filter controls compute `flex-direction: row` and `align-items: center`.
- Mobile filter group computes row layout and no Vue-only `12px` row/column gap.
- Mobile organization select remains `160px` wide.
- Mobile official and marker filters keep `20px` left margin.
- Existing mobile wrapper overflow checks remain green.
- Migration status and final review record the verified slice and gate evidence.
