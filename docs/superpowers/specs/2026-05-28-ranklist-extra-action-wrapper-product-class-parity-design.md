# Ranklist Extra Action Wrapper Product Class Parity Design

## Goal

Restore the old React SRK controls extra-action wrapper class contract by removing the Vue-only `rankland-ranklist-extra-action` class while preserving the wrapper node, Live scroll-solution toggle behavior, and no-gap controls chrome.

## Source Behavior

`rankland-fe/src/components/StyledRanklistRenderer.tsx` renders controls as:

```tsx
<div className="mt-3 mx-4 flex justify-between items-center">
  {showFilter && <div>...</div>}
  <div>{renderExtraActionArea ? renderExtraActionArea(memorizedData) : null}</div>
</div>
```

The extra-action container is a plain `div` with no class. This matters for product DOM parity because layout comes from the controls root and the rendered extra action content, not from a product-specific wrapper class.

## Current Target Gap

`src/client/components/rankland-ranklist.vue` currently renders:

```html
<div v-if="hasExtraAction" data-id="rankland-ranklist-extra-action" class="rankland-ranklist-extra-action">
```

Earlier slices removed the Vue-only gap and inline-flex chrome, but the extra-action wrapper still exposes a Vue-only product class.

## Target Behavior

The extra-action wrapper should keep the stable test hook but render with an empty class list:

```html
<div v-if="hasExtraAction" data-id="rankland-ranklist-extra-action">
```

The implementation preserves:

- the wrapper node when the extra-action slot is present;
- `data-id="rankland-ranklist-extra-action"`;
- old `display: block`;
- `column-gap` and `row-gap` as `normal`;
- Live scroll-solution toggle classes, text spacing, and Switch behavior;
- controls root old `mt-3 mx-4 flex justify-between items-center` class list.

## Non-Goals

- Do not change the Live `live-scroll-toggle` classes or markup.
- Do not change filter controls, organization Select, official Switch, or marker Radio.Group.
- Do not remove `data-id` hooks.
- Do not change ranklist routes without extra-action content.

## Test Strategy

Extend the existing Live full-chain controls chrome helper and primary Live route test:

- read `extraActionClasses` from `[data-id="rankland-ranklist-extra-action"]`;
- assert `extraActionClasses` is an empty array;
- assert it does not contain `rankland-ranklist-extra-action`;
- preserve existing display/gap and live-toggle assertions.

Expected RED: the focused Live full-chain test fails because the current Vue wrapper reports `["rankland-ranklist-extra-action"]`.

Expected GREEN: after removing the class from the Vue template, the focused Live full-chain test and full migration gate pass.

## Acceptance Criteria

- The Live extra-action wrapper renders with an empty class list.
- The wrapper keeps `data-id="rankland-ranklist-extra-action"` and remains visible.
- Controls root and live scroll toggle spacing remain covered.
- Migration docs record this product-class parity slice after verification.
