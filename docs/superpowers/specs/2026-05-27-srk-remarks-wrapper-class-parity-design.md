# SRK Remarks Wrapper Class Parity Design

## Context

The old React `StyledRanklistRenderer` renders SRK remarks inside the table wrapper with a Tailwind utility wrapper:

```tsx
{staticData.remarks && (
  <div className="mb-4 text-center">
    <span className="srk-remarks">备注：{resolveText(staticData.remarks)}</span>
  </div>
)}
```

The Vue `RanklandRanklist` already restores the visible remarks pill, wrapper-local placement, 16px bottom spacing, and centered alignment through `.rankland-ranklist-remarks`, but it does not preserve the old `mb-4 text-center` class tokens on the remarks wrapper. Existing status docs still leave lower-level SRK pixel parity as product-review-driven; this slice closes a concrete DOM/class parity gap without changing table rendering behavior.

## Decision

Add the old utility classes beside the existing stable Vue hook:

```vue
<div v-if="ranklistState.staticRanklist.remarks" class="rankland-ranklist-remarks mb-4 text-center">
```

Keep the existing `.rankland-ranklist-remarks` CSS and `.srk-remarks` pill CSS unchanged. The old utility classes are compatibility tokens and should not introduce a second spacing system.

## Test Strategy

Use the existing `/ranklist/:id` full-chain test because the mock SRK fixture already includes remarks and exercises SSR, hydration, the shared Vue SRK wrapper, and browser-computed styles.

The RED assertion should fail before implementation because the remarks wrapper currently has only `rankland-ranklist-remarks`. The GREEN assertion should pass after adding `mb-4 text-center`, while the existing computed-style assertions continue to prove 16px bottom margin and centered placement.

## Acceptance Criteria

- The remarks wrapper inside `data-id="rankland-ranklist-table-wrapper"` carries `rankland-ranklist-remarks`, `mb-4`, and `text-center`.
- The visible `.srk-remarks` pill behavior remains unchanged.
- Focused `/ranklist/:id` full-chain coverage passes after a verified RED failure.
- `docs/migration/status.md`, `docs/migration/manual-acceptance-checklist.md`, and `docs/migration/final-integration-review.md` record the verified class parity.
- The full migration gate passes: `gen:client-router`, `test:migration`, and `git diff --check`.

## Non-Goals

- Do not change `@algoux/standard-ranklist-renderer-component-vue` internals.
- Do not claim broad low-level table pixel parity.
- Do not alter remarks text, pill colors, border, padding, or placement.
