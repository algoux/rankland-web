# SRK Table Spacer DOM Parity Design

## Context

The old React `StyledRanklistRenderer` renders a real Tailwind spacer before the SRK table wrapper:

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

The Vue migration already restored the effective 24px gap with `.rankland-ranklist-table-wrapper { margin-top: 24px; }`, but it does not preserve the old spacer DOM or the `mt-6` class token. Most SRK wrapper work has been moving from computed-only parity toward old DOM/class parity for product review. This slice keeps the visual gap unchanged and restores that missing table spacer structure.

## Decision

Render an explicit spacer immediately before `data-id="rankland-ranklist-table-wrapper"`:

```vue
<div data-id="rankland-ranklist-table-spacer" class="rankland-ranklist-table-spacer mt-6" />
```

Move the 24px top margin from `.rankland-ranklist-table-wrapper` to the old `mt-6` utility class. Keep the local `rankland-ranklist-table-spacer` hook only for tests and future review; the old class remains the source of the spacing.

## Scope

In scope:

- Shared `src/client/components/rankland-ranklist.vue` table area.
- `/ranklist/:id` full-chain coverage for spacer DOM, `mt-6` class, computed 24px margin, and unchanged controls-to-table gap.
- Migration documentation for the verified slice.

Out of scope:

- Low-level `@algoux/standard-ranklist-renderer-component-vue` internals.
- Table column widths, row heights, sticky header behavior, or status-cell content.
- Route-specific `ml-4` offset behavior.

## Test Strategy

Extend `tests/e2e/full-chain/ranklist.spec.ts` with a helper that reads the spacer class list and computed margin. The RED failure should be a missing `rankland-ranklist-table-spacer` element. The GREEN result must show:

- `spacerClasses` includes `rankland-ranklist-table-spacer` and `mt-6`;
- `spacerMarginTop` is `24px`;
- `tableWrapperMarginTop` is `0px`;
- the existing controls-to-table gap remains `24`.

## Acceptance Criteria

- Focused Ranklist full-chain RED fails before implementation because the spacer element is missing.
- Focused Ranklist full-chain GREEN passes after implementation.
- The full migration gate passes: `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check`.
- Migration docs record SRK table spacer DOM parity as verified.
