# User Modal Markers Product Class Parity Design

## Context

Old React `rankland-fe/src/components/UserInfoModal.tsx` renders the user marker row as:

```tsx
<div className="user-modal-info-markers mt-2">
```

The migrated Vue renderer currently renders:

```vue
<div v-if="activeUserMarkerLabels.length > 0" class="rankland-user-modal-markers user-modal-info-markers mt-2">
```

Earlier slices restored the old `mt-2` token, marker label styling, and 8px top spacing. This slice tightens the product DOM contract by removing the Vue-only `rankland-user-modal-markers` class from the marker-row wrapper.

## Scope

- Render the marker row with exact old React class tokens: `user-modal-info-markers mt-2`.
- Preserve marker label nodes, `data-id="rankland-user-modal-marker"`, preset marker classes, label text, and computed marker label styling.
- Preserve marker-row block display and 8px top margin.
- Retarget scoped CSS from `.rankland-user-modal-markers` to a selector that uses the old marker-row class tokens.

## Non-Goals

- Do not change team-members, unofficial notice, segment, photo/slogan, or rank-time modal rows.
- Do not change individual marker label classes such as `rankland-user-modal-marker` or `user-modal-info-marker`.
- Do not change marker resolution, order, labels, or SRK fixture data.

## Test Strategy

Update `tests/e2e/full-chain/ranklist.spec.ts` in the existing Ranklist full-chain scenario:

- Locate the marker row through `.user-modal-info-markers`.
- Assert the row has exact class list `user-modal-info-markers mt-2`.
- Assert the row class list does not contain `rankland-user-modal-markers`.
- Keep existing marker-row computed display/margin assertions and marker label assertions.

Expected RED: the focused Ranklist full-chain test fails because the current Vue row still emits `rankland-user-modal-markers user-modal-info-markers mt-2`.

Expected GREEN: after removing the Vue-only class and retargeting CSS, the focused Ranklist full-chain test and full Ranklist full-chain file pass.

## Acceptance Criteria

- The marker row exact product class list is `user-modal-info-markers mt-2`.
- The row does not render Vue-only `rankland-user-modal-markers`.
- Existing marker label text, marker classes, label styling, and row computed spacing stay green.
- Migration docs record the slice and verification evidence.
- Before commit, `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass.
