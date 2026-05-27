# SRK Banner MB-2 Spacing Parity Design

## Goal

Restore the old React SRK header banner spacing contract by making the banner image's `mb-2` class provide the 8px bottom margin, instead of putting that margin on the Vue-only banner wrapper.

## Source Behavior

Old `rankland-fe/src/components/StyledRanklistRenderer.tsx` rendered the banner area as:

```tsx
<div className="flex items-center justify-center">
  <SrkAssetImage
    className="mb-2"
    style={{ maxWidth: 'min(100%, 1820px)', maxHeight: '40vh' }}
  />
</div>
```

The wrapper had no bottom margin. The image carried `mb-2`, which maps to an 8px bottom margin in the old utility setup.

## Current Gap

Current Vue markup already preserves the old class tokens:

- wrapper includes `flex items-center justify-center`;
- image includes `mb-2`.

However, the computed spacing source is different:

- `.rankland-ranklist-banner-wrap` currently applies `margin-bottom: 8px`;
- `.rankland-ranklist-banner.mb-2` does not provide a computed image margin.

This keeps a similar visual total but does not match the old DOM/CSS responsibility.

## Target Behavior

- Banner wrapper computed `margin-bottom` is `0px`.
- Banner image computed `margin-bottom` is `8px`.
- Existing wrapper/image class tokens remain present.
- Existing image `max-width: min(100%, 1820px)` and `max-height: 40vh` behavior remains unchanged.
- Broken banner hiding behavior remains unchanged.

## Non-Goals

- Do not modify low-level `@algoux/standard-ranklist-renderer-component-*` table rendering.
- Do not add global Tailwind utility coverage for every old utility class.
- Do not change banner source URL rewriting or image error handling.

## Test Strategy

Update the existing `/ranklist/:id` full-chain E2E header helper because this is hydrated DOM/CSS parity for the shared SRK renderer. The RED failure should show wrapper `margin-bottom: 8px` and image `margin-bottom: 0px`. The GREEN run should verify wrapper `0px`, image `8px`, and the existing class-token assertions.

## Acceptance Criteria

- Focused full-chain ranklist test fails before implementation for banner margin source assertions.
- Focused full-chain ranklist test passes after implementation.
- Full migration gate passes with generated routes, build, unit, SSR, shallow E2E, full-chain E2E, and `git diff --check`.
- Migration status, manual acceptance checklist, and final integration review mention this verified slice.
