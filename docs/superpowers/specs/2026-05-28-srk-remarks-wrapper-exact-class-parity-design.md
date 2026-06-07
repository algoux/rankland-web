# SRK Remarks Wrapper Exact Class Parity Design

Date: 2026-05-28
Branch: `migration/live-page-foundation`

## Context

Old React `StyledRanklistRenderer` renders remarks inside the table wrapper as:

```tsx
<div className="mb-4 text-center">
  <span className="srk-remarks">备注：...</span>
</div>
```

The Vue migration already restored wrapper-local placement, the visible `.srk-remarks` pill, the old `mb-4 text-center` class tokens, and the computed 16px bottom spacing. The wrapper still carries a Vue-only `rankland-ranklist-remarks` product class, which is not part of the old React DOM contract.

## Decision

- Render the remarks wrapper with exact class list `mb-4 text-center`.
- Remove the Vue-only `rankland-ranklist-remarks` class from product DOM.
- Keep the visible `.srk-remarks` pill and its border, opacity, padding, and font behavior unchanged.
- Preserve the 16px bottom margin and centered alignment by styling the old class combination under `[data-id='rankland-ranklist-table-wrapper']`.

## Test Strategy

Use `/ranklist/:id` full-chain coverage because remarks are rendered from the mock SRK fixture after SSR/hydration.

The focused test reads `.srk-remarks.parentElement` and asserts:

- class list is exactly `['mb-4', 'text-center']`;
- `rankland-ranklist-remarks` is absent;
- computed `margin-bottom` remains `16px`;
- computed `text-align` remains `center`;
- the existing `.srk-remarks` pill assertions continue to pass.

## Acceptance Criteria

- RED fails against the current Vue output because the wrapper still includes `rankland-ranklist-remarks`.
- GREEN passes after removing the Vue-only class and preserving computed wrapper/pill styling.
- Full ranklist full-chain file passes.
- Full `test:migration` and `git diff --check` pass before commit.
- Migration docs record the verified exact-class slice and keep lower-level table pixel parity product-review-driven.

## Risks

The selector used to preserve wrapper spacing is scoped to the table wrapper and old class combination. This avoids introducing a generic local `.mb-4` or `.text-center` rule that could affect unrelated nodes.
