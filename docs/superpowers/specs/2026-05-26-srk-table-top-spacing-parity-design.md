# SRK Table Top Spacing Parity Design

## Context

The old React `StyledRanklistRenderer` always inserts a Tailwind `mt-6` spacer immediately before the SRK table wrapper:

```tsx
<div className="mt-6" />
<div className={tableClass} style={tableStyle}>
  {staticData.remarks && (
    <div className="mb-4 text-center">
      <span className="srk-remarks">备注：{resolveText(staticData.remarks)}</span>
    </div>
  )}
  <Ranklist ... />
</div>
```

That creates a 24px vertical gap between the filter/extra-action row and the rendered table area. The migrated Vue wrapper currently places the table wrapper directly after `.rankland-ranklist-controls`, whose own bottom margin is 16px:

```vue
<div v-if="showFilter || hasExtraAction" class="rankland-ranklist-controls">...</div>
<div data-id="rankland-ranklist-table-wrapper" :class="tableClass">...</div>
```

This leaves the shared table area 8px tighter than the old React product layout.

## Decision

Add a stable local class to the shared Vue table wrapper and set `margin-top: 24px`. Keep route-specific `tableClass` behavior such as `ml-4` intact by binding both classes. Because normal adjacent vertical margins collapse to the larger value, this restores the old effective `mt-6` gap without stacking an extra 24px on top of the controls' existing bottom margin.

## Scope

In scope:

- Shared `src/client/components/rankland-ranklist.vue` table wrapper.
- Full-chain `/ranklist/:id` coverage using the existing controls and table wrapper.
- Migration dashboard updates.

Out of scope:

- Horizontal `ml-4` table wrapper offset, already covered by `2026-05-26-srk-table-offset-parity`.
- Table columns, row heights, problem-cell styling, remarks pill styling, and modal layout.
- Route-level content spacing outside the shared SRK wrapper.

## Test Strategy

Add a full-chain Playwright helper that measures:

```ts
tableWrapper.getBoundingClientRect().top - controls.getBoundingClientRect().bottom
```

On `/ranklist/test-key?focus=yes`, assert the controls-to-table gap is `24px`. The RED failure should show the current Vue layout at `16px`.

## Acceptance Criteria

- Focused full-chain ranklist test fails before implementation with a `16px` controls-to-table gap.
- Focused full-chain ranklist test passes after implementation with a `24px` gap.
- Existing table wrapper `margin-left: 16px` behavior for standalone ranklist stays green.
- Required gates pass: `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check`.
- `docs/migration/status.md` records SRK table top-spacing parity.
