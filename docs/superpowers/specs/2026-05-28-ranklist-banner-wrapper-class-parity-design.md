# Ranklist Banner Wrapper Class Parity Design

## Context

Old React `StyledRanklistRenderer.tsx` renders the contest banner wrapper as:

```tsx
<div className="flex items-center justify-center">
  <SrkAssetImage className="mb-2" />
</div>
```

The migrated Vue renderer currently renders:

```vue
<div class="rankland-ranklist-banner-wrap flex items-center justify-center">
  <SrkAssetImage img-class="rankland-ranklist-banner mb-2" />
</div>
```

The `rankland-ranklist-banner-wrap` class is a Vue-only product class. The old product contract is the utility class list.

## Decision

Remove `.rankland-ranklist-banner-wrap` from the banner wrapper while preserving:

- old `flex items-center justify-center` class tokens;
- centered banner layout;
- 0px wrapper bottom margin;
- 8px banner image bottom margin;
- existing `data-id="rankland-ranklist-banner"` image hook and asset-error behavior.

Move the wrapper presentation from the product class selector to a scoped selector matching the old utility shape.

## Test Strategy

Use the existing Ranklist full-chain route test:

- assert banner wrapper classes contain `flex`, `items-center`, `justify-center`;
- assert banner wrapper classes do not contain `rankland-ranklist-banner-wrap`;
- assert computed wrapper `display`, `align-items`, `justify-content`, and bottom margin remain correct;
- keep existing banner image class/margin and asset URL assertions.

## Acceptance Criteria

- Focused RED fails against current Vue output because the banner wrapper lacks complete old utility semantics (`align-items: normal`) and the test also guards that `.rankland-ranklist-banner-wrap` must not be present.
- Focused GREEN passes after implementation.
- Full `tests/e2e/full-chain/ranklist.spec.ts` passes.
- Full migration gate passes before commit.
- Migration docs record this slice.
