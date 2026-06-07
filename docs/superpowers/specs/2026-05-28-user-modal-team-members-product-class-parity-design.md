# User Modal Team Members Product Class Parity Design

## Context

Old React `rankland-fe/src/components/UserInfoModal.tsx` renders the team-members row as:

```tsx
<div className="user-modal-info-team-members mt-2">
```

The migrated Vue renderer currently renders:

```vue
<div
  data-id="rankland-user-modal-team-members"
  class="rankland-user-modal-team-members user-modal-info-team-members mt-2"
>
```

Earlier slices restored the old `mt-2` token, raw ` / ` separator text, item-level member `span` DOM, opacity, padding, and 8px top spacing. This slice tightens the product DOM class contract by removing the Vue-only `rankland-user-modal-team-members` class from the rendered row.

## Scope

- Render the team-members row with exact old React class tokens: `user-modal-info-team-members mt-2`.
- Preserve `[data-id="rankland-user-modal-team-members"]` as the stable full-chain test hook.
- Preserve member text, item-level entry spans, raw ` / ` separator text, separator style, row opacity, 6px top padding, block display, and 8px top margin.
- Retarget scoped CSS from `.rankland-user-modal-team-members` to a selector that uses the stable `data-id` plus old class tokens.

## Non-Goals

- Do not change marker rows, photo/slogan wrappers, segment labels, or rank-time panel classes.
- Do not remove data-id hooks used by the migration full-chain tests.
- Do not change team member sorting, text resolution, or SRK fixture data.

## Test Strategy

Update `tests/e2e/full-chain/ranklist.spec.ts` in the existing Ranklist full-chain scenario:

- Assert `[data-id="rankland-user-modal-team-members"]` has exact class list `user-modal-info-team-members mt-2`.
- Assert the row class list does not contain `rankland-user-modal-team-members`.
- Keep existing assertions for `Alice`, `Bob`, raw ` / ` separator text, item-level entry spans, display, opacity, margin, and padding.

Expected RED: the focused Ranklist full-chain test fails because the current Vue row still emits `rankland-user-modal-team-members user-modal-info-team-members mt-2`.

Expected GREEN: after removing the Vue-only class and retargeting CSS, the focused Ranklist full-chain test and full Ranklist full-chain file pass.

## Acceptance Criteria

- The team-members row exact product class list is `user-modal-info-team-members mt-2`.
- The row does not render Vue-only `rankland-user-modal-team-members`.
- Existing member DOM, separator text, and computed style coverage stays green.
- Migration docs record the slice and verification evidence.
- Before commit, `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass.
