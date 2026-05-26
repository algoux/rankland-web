# User Modal Photo Wrapper Class Parity Design

## Goal

Restore the old React user modal photo-section wrapper utility class token in the Vue SRK wrapper without changing image URL rewriting, image sizing, or slogan rendering.

## Source Behavior

`rankland-fe/src/components/UserInfoModal.tsx` renders the optional photo and slogan inside:

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

The current Vue wrapper has a separate `.rankland-user-modal-photo` hook with equivalent `margin-top: 16px` and full-width image styling, but it does not expose the old `mt-4` class token on the photo wrapper.

## Target Behavior

`src/client/components/rankland-ranklist.vue` should render the photo wrapper with:

```html
class="rankland-user-modal-photo mt-4"
```

The migrated hook remains responsible for local image styles. The old utility class token is restored for DOM parity with `rankland-fe` and for downstream visual review selectors.

## Non-Goals

- Do not change SRK asset URL rewriting or image `alt` text.
- Do not change the image width/max-width behavior.
- Do not merge the current Vue photo and slogan nodes into one shared wrapper in this slice; that would be a broader DOM structure change and needs separate review.

## Test Strategy

Extend the existing Ranklist full-chain user modal photo assertions.

The test should:

- locate the photo wrapper through `.rankland-user-modal-photo`;
- verify the wrapper carries `mt-4`;
- verify the wrapper still computes to `margin-top: 16px`;
- keep the existing image `alt`, full-width, and max-width assertions.

Use TDD: the focused Ranklist full-chain test must fail before implementation because the current photo wrapper lacks `mt-4`, then pass after the Vue template change.

## Acceptance Criteria

- Focused Ranklist full-chain test fails RED for missing `mt-4` before production code changes.
- Focused Ranklist full-chain test passes GREEN after implementation.
- Full migration gate passes after docs are updated.
- Migration dashboard, manual acceptance checklist, and final integration review mention photo wrapper class parity.
