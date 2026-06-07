# Ranklist Banner Image Class/Style Parity Design

Date: 2026-05-28
Branch: `migration/live-page-foundation`

## Context

Old React `StyledRanklistRenderer` renders the SRK contest banner image inside a `div.flex.items-center.justify-center`. The image itself has only the `mb-2` class and carries the size contract as inline style:

```tsx
className="mb-2"
style={{ maxWidth: 'min(100%, 1820px)', maxHeight: '40vh' }}
```

The migrated Vue renderer already preserved the banner wrapper and margin behavior, but the image still carried a Vue-only `rankland-ranklist-banner` product class and moved the max size contract into scoped CSS. That made the DOM/style source differ from the old React public surface.

## Decision

- Keep the existing wrapper contract: `flex items-center justify-center`.
- Render the banner image with exact old class list `mb-2`.
- Move `max-width: min(100%, 1820px)` and `max-height: 40vh` back onto the image as inline style.
- Remove the Vue-only `rankland-ranklist-banner` product class and scoped size CSS.
- Preserve stable `data-id="rankland-ranklist-banner"` for tests and the existing broken-image hiding behavior from `SrkAssetImage`.
- Preserve the 8px bottom margin currently provided by the local `mb-2` utility rule.

## Test Strategy

Use the existing ranklist full-chain route test because the behavior is public DOM and style parity after SSR/hydration.

The header helper asserts:

- banner image class list is exactly `['mb-2']`;
- the image does not contain `rankland-ranklist-banner`;
- inline style contains `max-width: min(100%, 1820px)`;
- inline style contains `max-height: 40vh`;
- the wrapper and existing computed spacing checks remain intact.

## Acceptance Criteria

- RED fails when the image still carries `rankland-ranklist-banner` and lacks the old inline size style.
- GREEN passes with the image class restored to `mb-2` and inline size style restored.
- `tests/e2e/full-chain/ranklist.spec.ts` passes.
- Full `corepack pnpm test:migration` passes before commit.
- Migration status, manual acceptance, and final integration review docs record the slice.

## Risks

`SrkAssetImage` relies on Vue fallthrough attributes to merge the root image style with its internal error-hiding style. The focused full-chain test verifies the resulting DOM style, so no broader component API change is needed for this slice.
