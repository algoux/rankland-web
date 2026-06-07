# User Modal Photo Inline Width Parity Design

Date: 2026-05-28
Branch: `migration/live-page-foundation`

## Context

Old React `UserInfoModal` renders user photos through `SrkAssetImage` with an inline width style:

```tsx
<SrkAssetImage
  image={photo}
  assetScope={assetsScope}
  alt="选手照片"
  style={{ width: '100%' }}
/>
```

The Vue migration already restores the computed full-width photo presentation through scoped CSS on `.rankland-user-modal-photo img`, and full-chain coverage checks the computed width. The product DOM still differs because the user photo image does not expose the old inline `width: 100%` style contract.

## Decision

- Pass `style="width: 100%"` to the Vue user-photo `SrkAssetImage` usage.
- Keep the existing `.rankland-user-modal-photo.mt-4` wrapper and computed full-width CSS.
- Do not change contest banner image inline style behavior.
- Do not broaden this slice into low-level SRK table pixel parity.

## Test Strategy

Use the existing `/ranklist/:id` full-chain user modal scenario. Open Team Alpha's user modal and assert:

- `[data-id="rankland-user-modal-photo"]` has inline style containing `width: 100%`;
- computed photo width remains equal to the modal body width;
- computed `max-width` remains `100%`;
- existing broken-image hiding coverage remains unchanged.

## Acceptance Criteria

- RED fails before implementation because the Vue user photo does not have inline `width: 100%`.
- GREEN passes after adding the inline style to the `SrkAssetImage` usage.
- Ranklist full-chain file passes.
- Full `test:migration` and `git diff --check` pass before commit.
- Migration docs record this exact user-modal photo inline-style parity slice and keep broader lower-level table parity product-review-driven.

## Risks

Low risk. This adds the old inline width style to the existing image component usage while leaving the existing computed-width CSS and broken-image hiding behavior in place.
