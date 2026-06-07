# User Modal Photo Wrapper Product Class Parity Design

## Goal

Restore the exact old React product class contract for the user modal photo/slogan wrapper by removing the Vue-only `rankland-user-modal-photo` class while preserving the old unconditional `div.mt-4` wrapper, shared photo/slogan parent, empty wrapper behavior, and full-width photo presentation.

## Source Behavior

`rankland-fe/src/components/UserInfoModal.tsx` always renders the photo/slogan section as:

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

The wrapper exists even when a user has no photo and no slogan. Its only class is `mt-4`.

## Current Target Gap

`src/client/components/rankland-ranklist.vue` currently renders:

```html
<div class="rankland-user-modal-photo mt-4">
```

Earlier slices restored the old `mt-4` token, shared photo/slogan parent, empty wrapper, and inline photo width, but intentionally kept the migrated `.rankland-user-modal-photo` hook. That hook is not part of the old React product DOM.

## Target Behavior

The shared photo/slogan wrapper should render exact old React class list:

```html
<div class="mt-4">
```

The implementation keeps:

- the unconditional wrapper inside `.user-modal`;
- `[data-id="rankland-user-modal-photo"]` on the image;
- `[data-id="rankland-user-modal-slogan"]` on the slogan;
- old inline `style="width: 100%"` on the image;
- computed photo width and `max-width: 100%`;
- broken-image hiding behavior;
- the empty wrapper for users without photo or slogan.

CSS that currently targets `.rankland-user-modal-photo img` should move to a product-neutral selector that uses the stable modal hook and old wrapper class, for example:

```less
[data-id='rankland-ranklist-user-modal'] .user-modal > .mt-4 img {
  max-width: 100%;
}
```

## Non-Goals

- Do not change SRK asset URL rewriting or image error handling.
- Do not change slogan classes or typography.
- Do not change rank-time chart wrapper class parity.
- Do not add a new wrapper `data-id`; old React did not expose one.

## Test Strategy

Update the existing Ranklist full-chain user modal assertions:

- locate the wrapper through photo/slogan parent relationships and `.user-modal > div.mt-4`, not `.rankland-user-modal-photo`;
- assert the wrapper class list is exactly `mt-4`;
- assert the wrapper class list does not contain `rankland-user-modal-photo`;
- preserve shared parent, empty wrapper, photo width, and slogan assertions.

Expected RED: the focused Ranklist full-chain test fails because the current Vue wrapper reports `rankland-user-modal-photo mt-4` instead of exact `mt-4`.

Expected GREEN: after removing the Vue-only class and retargeting CSS, the focused Ranklist full-chain test and full Ranklist full-chain file pass.

## Acceptance Criteria

- The photo/slogan wrapper renders exact old React `mt-4`.
- The wrapper no longer renders `rankland-user-modal-photo`.
- The image and slogan remain children of the same wrapper.
- Users without photo/slogan still render one empty `div.mt-4` wrapper.
- Photo computed width, `max-width: 100%`, inline width, and broken-image hiding remain covered.
- Migration docs record this product-class parity slice after verification.
