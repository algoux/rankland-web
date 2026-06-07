# Ranklist Header Meta Class Parity Design

## Context

Old React `StyledRanklistRenderer.tsx` renders the SRK header metadata block as:

```tsx
<div className="text-center mt-1">
  ...
</div>
```

The migrated Vue renderer currently renders:

```vue
<div data-id="rankland-ranklist-header-meta" class="rankland-ranklist-header-meta text-center mt-1">
  ...
</div>
```

The stable `data-id` is a test hook, but `.rankland-ranklist-header-meta` is a Vue-only product class. Previous slices already restored the metadata block's child DOM, no-gap behavior, block display, 14px text size, and old utility class tokens. This slice restores the class attribute contract.

## Decision

Remove `.rankland-ranklist-header-meta` from the product DOM while preserving:

- old `text-center mt-1` class tokens;
- stable `data-id="rankland-ranklist-header-meta"` for tests;
- metadata block child structure for view count, actions, contributors, and reference links;
- block display and no declared flex gap;
- 4px top margin from old `mt-1`;
- 14px header metadata text size;
- existing light/dark metadata text color behavior.

Move the metadata block presentation from the Vue-only product class selector to a scoped stable-hook selector that also requires the old utility class shape.

## Test Strategy

Use the existing Ranklist full-chain route test:

- assert metadata block classes are exactly `text-center mt-1`;
- assert metadata block classes do not contain `rankland-ranklist-header-meta`;
- keep existing computed checks for display, no gap, text size, child DOM, and metadata spacing.

## Acceptance Criteria

- Focused RED fails against current Vue output because `.rankland-ranklist-header-meta` is present.
- Focused GREEN passes after implementation.
- Full `tests/e2e/full-chain/ranklist.spec.ts` passes.
- Full migration gate passes before commit.
- Migration docs record this slice.
