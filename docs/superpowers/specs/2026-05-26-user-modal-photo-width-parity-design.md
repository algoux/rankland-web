# User Modal Photo Width Parity Design

## Goal

Restore the old React user modal photo sizing contract in the Vue SRK wrapper.

## Old React Baseline

`rankland-fe/src/components/UserInfoModal.tsx` renders the user's photo through `SrkAssetImage` with an explicit full-width style:

```tsx
<SrkAssetImage
  image={photo}
  assetScope={assetsScope}
  alt="选手照片"
  style={{ width: '100%' }}
/>
```

The photo sits inside the same `mt-4` block as the slogan, so the visible contract is a full-width image with the existing vertical spacing.

## Current Vue Gap

`src/client/components/rankland-ranklist.vue` renders the photo as:

```vue
<img data-id="rankland-user-modal-photo" :src="activeUserPhotoSrc" alt="选手照片">
```

The scoped CSS only sets `max-width: 100%`. That prevents overflow but does not match the old explicit `width: 100%` behavior, so smaller photos can render at their intrinsic width instead of filling the modal content area.

## Scope

- Add full-chain coverage for Team Alpha's photo element in the user modal.
- Assert the migrated image keeps the old `width: 100%` sizing contract while preserving `max-width: 100%`.
- Update only the Vue user modal photo CSS.
- Update migration status after verification.

## Non-Goals

- No changes to asset URL rewriting, `SrkAssetImage`, or backend fixture routing.
- No changes to marker labels, slogan, segment labels, team members, or rank-time chart.
- No generated router changes.

## Test Strategy

Use `/ranklist/:id` full-chain coverage. Open Team Alpha's user modal and inspect `[data-id="rankland-user-modal-photo"]` computed style. The test should fail before implementation because `width` is not explicitly `100%`, then pass once the Vue scoped CSS restores old sizing.

## Acceptance Criteria

- Focused ranklist full-chain test fails before implementation because the photo lacks explicit `width: 100%`.
- Focused ranklist full-chain test passes after implementation.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- `docs/migration/status.md` records this verified slice.
