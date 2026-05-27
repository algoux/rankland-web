# User Modal Empty Photo Wrapper Parity Design

## Context

The old React `UserInfoModal` always renders the photo/slogan wrapper:

```tsx
<div className="mt-4">
  {photo && <SrkAssetImage ... />}
  {slogan && <p className="slogan mt-4 mb-2">{slogan}</p>}
</div>
```

This wrapper exists even when a user has no photo and no `x_slogan`. The Vue SRK wrapper currently renders the equivalent wrapper only when `activeUserPhotoSrc || activeUserSlogan` is truthy:

```vue
<div v-if="activeUserPhotoSrc || activeUserSlogan" class="rankland-user-modal-photo mt-4">
```

That preserves the common visible case but misses the old DOM/spacing contract for users without photo or slogan.

## Decision

Render the Vue `.rankland-user-modal-photo.mt-4` wrapper unconditionally inside the active user-modal body, matching old React's unconditional `div.mt-4`. Keep the existing conditional image and slogan children unchanged.

The wrapper keeps the migrated `.rankland-user-modal-photo` hook and old `mt-4` class token. Users with no photo and no slogan get an empty wrapper, exactly like the old React component.

## Test Strategy

Extend the existing Ranklist full-chain user-modal scenario:

- open Team Beta, which has no `photo` and no `x_slogan`;
- assert `.rankland-user-modal-photo` exists and carries old `mt-4`;
- assert the wrapper has no image or slogan child;
- assert the wrapper keeps the existing 16px top spacing.

The focused RED should fail because the current Vue wrapper is absent for Team Beta. The focused GREEN should pass after removing the `v-if` from the wrapper.

## Acceptance Criteria

- User modal photo/slogan wrapper is present for users without photo and slogan.
- The wrapper keeps `rankland-user-modal-photo mt-4`.
- Existing user photo, slogan, shared-parent, full-width image, and broken-image hiding coverage remain green.
- Migration docs record user modal empty photo wrapper parity.
- The full migration gate passes: `gen:client-router`, `test:migration`, and `git diff --check`.

## Non-Goals

- Do not change photo URL resolution or `SrkAssetImage`.
- Do not add fallback photo or placeholder content.
- Do not change rank-time chart rendering.
- Do not redesign user-modal layout.
