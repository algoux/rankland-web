# User Modal Photo Slogan Wrapper Parity Design

## Goal

Restore the old React user modal photo-and-slogan wrapper DOM structure in the Vue SRK wrapper while preserving the already verified photo sizing, photo wrapper class, slogan styling, and SRK asset URL behavior.

## Source Behavior

`rankland-fe/src/components/UserInfoModal.tsx` renders the optional photo and slogan inside the same `div.mt-4` block:

```tsx
<div className="mt-4">
  {photo && (
    <SrkAssetImage
      image={photo}
      assetScope={assetsScope}
      alt="选手照片"
      style={{ width: '100%' }}
    />
  )}
  {slogan && <p className="slogan mt-4 mb-2">{slogan}</p>}
</div>
```

That means the slogan is not a sibling of the photo wrapper. It is a child of the same top-level `mt-4` wrapper that contains the photo.

## Current Vue Gap

`src/client/components/rankland-ranklist.vue` currently renders:

```vue
<div v-if="activeUserPhotoSrc" class="rankland-user-modal-photo mt-4">
  <img data-id="rankland-user-modal-photo" :src="activeUserPhotoSrc" alt="选手照片">
</div>
<p
  v-if="activeUserSlogan"
  data-id="rankland-user-modal-slogan"
  class="rankland-user-modal-slogan slogan mt-4 mb-2"
>
  {{ activeUserSlogan }}
</p>
```

The previous slice restored the old `mt-4` class token on the photo wrapper, but the DOM structure is still different because the slogan is outside that wrapper.

## Target Behavior

Render one shared wrapper whenever either the photo or slogan exists:

```vue
<div v-if="activeUserPhotoSrc || activeUserSlogan" class="rankland-user-modal-photo mt-4">
  <img
    v-if="activeUserPhotoSrc"
    data-id="rankland-user-modal-photo"
    :src="activeUserPhotoSrc"
    alt="选手照片"
  >
  <p
    v-if="activeUserSlogan"
    data-id="rankland-user-modal-slogan"
    class="rankland-user-modal-slogan slogan mt-4 mb-2"
  >
    {{ activeUserSlogan }}
  </p>
</div>
```

The migrated `.rankland-user-modal-photo` hook remains on the shared wrapper. Its nested `img` CSS still provides full-width photo behavior.

## Non-Goals

- Do not change SRK asset URL rewriting, image `alt`, `src`, width, or max-width behavior.
- Do not change slogan classes, text, pseudo-label, font, or spacing.
- Do not change rank-time panel chrome or user modal rows outside the photo/slogan section.
- Do not introduce a separate wrapper class unless a later visual review needs it.

## Test Strategy

Extend the existing `/ranklist/:id` full-chain user modal test.

The test should:

- keep locating the wrapper through `.rankland-user-modal-photo`;
- keep asserting the wrapper has `mt-4` and computes to 16px top margin;
- assert the photo and slogan share the same parent element;
- assert the slogan's parent is the `.rankland-user-modal-photo` wrapper;
- keep the existing image `alt`, width/max-width, slogan class, typography, pseudo-label, and font assertions.

Use TDD: the focused Ranklist full-chain test must fail before implementation because the current slogan parent is `.rankland-user-modal-body`, then pass after the Vue template is restructured.

## Acceptance Criteria

- Focused Ranklist full-chain test fails RED for the current sibling DOM structure before production code changes.
- Focused Ranklist full-chain test passes GREEN after implementation.
- Full migration gate passes after docs are updated.
- Migration dashboard, manual acceptance checklist, and final integration review mention photo/slogan shared wrapper DOM parity.
