# Ranklist View Count Class Parity Design

## Goal

Restore the SRK header view-count node to the old React class contract while preserving the migrated Vue `data-id` selector and all verified visual behavior.

## Source Behavior

Old React `StyledRanklistRenderer.tsx` renders the metadata block as:

```tsx
<div className="text-center mt-1">
  {meta && (
    <span className="mr-2">
      <EyeOutlined /> {meta.viewCnt || '-'}
    </span>
  )}
</div>
```

The visible view-count element has only the old utility class `mr-2`. It does not expose a product-specific `rankland-ranklist-view-count` class.

## Current Gap

The Vue renderer currently emits:

```vue
<span data-id="rankland-ranklist-view-count" class="rankland-ranklist-view-count mr-2">
```

The extra `rankland-ranklist-view-count` class is a Vue-only DOM/class contract difference. Existing full-chain coverage checks the text, Eye icon, `mr-2` presence, font size, and color, but it does not fail when the extra product class remains.

## Design

- Keep `data-id="rankland-ranklist-view-count"` as the stable E2E/test hook.
- Render the product class list as exact old React `mr-2`.
- Keep the Eye icon and `meta.viewCnt || '-'` fallback unchanged.
- Preserve existing color parity by moving the local color rule from `.rankland-ranklist-view-count` to `[data-id='rankland-ranklist-view-count'].mr-2`.
- Preserve existing 14px metadata text-size behavior through the parent metadata block.
- Preserve conditional header-action separator behavior keyed by `hasViewCount`.

## Test Strategy

- Add a full-chain E2E assertion in the primary ranklist detail route test:
  - `Array.from(element.classList)` equals `['mr-2']`.
  - The class list does not contain `rankland-ranklist-view-count`.
- Verify RED by running the focused ranklist detail route test before implementation.
- Verify GREEN with the same focused command after implementation.
- Run the full `ranklist.spec.ts` regression before broad migration gates.

## Acceptance Criteria

- View-count text remains `42` in the primary fixture.
- Missing `viewCnt` still renders `-`.
- Eye icon remains visible.
- The view-count node keeps only `mr-2` as its product class list.
- Light/dark metadata color checks still pass.
- Full migration gate passes.

## Risks

- The selector-specific CSS must keep the migrated color behavior without reintroducing a product class.
- The `data-id` selector must not be removed because current E2E and future audits rely on it.
