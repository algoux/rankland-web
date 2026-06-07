# Ranklist Table Spacer Class Parity Design

## Context

Old React `StyledRanklistRenderer.tsx` renders the table spacer as:

```tsx
<div className="mt-6" />
<div className={tableClass} style={tableStyle}>
```

The migrated Vue renderer currently renders:

```vue
<div data-id="rankland-ranklist-table-spacer" class="rankland-ranklist-table-spacer mt-6" />
```

The stable `data-id` is a test hook, but `.rankland-ranklist-table-spacer` is a Vue-only product class that is not part of the old React DOM contract.

## Decision

Restore the product class contract for the spacer to old React's plain `mt-6` class while keeping `data-id="rankland-ranklist-table-spacer"` for full-chain tests.

Do not change:

- spacer position before the table wrapper;
- 24px controls-to-table visual gap;
- table wrapper class/style behavior;
- modal/footer ancestry inside/after the table wrapper.

## Test Strategy

Use the existing Ranklist full-chain route test because the behavior is DOM and layout visible:

- assert spacer class list contains `mt-6`;
- assert spacer class list does not contain `.rankland-ranklist-table-spacer`;
- keep existing computed `24px` spacer margin and `0px` table-wrapper margin checks;
- keep ranklist full-chain regression for surrounding renderer behavior.

## Acceptance Criteria

- Focused RED fails against current Vue output because `.rankland-ranklist-table-spacer` is present.
- Focused GREEN passes after implementation.
- Full `tests/e2e/full-chain/ranklist.spec.ts` passes.
- Full migration gate passes before commit.
- Migration docs record this slice.
