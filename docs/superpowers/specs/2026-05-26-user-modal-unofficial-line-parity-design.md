# User Modal Unofficial Line Parity Design

## Goal

Restore the old React user modal unofficial-participant line presentation in the Vue SRK wrapper.

## Old React Baseline

`rankland-fe/src/components/UserInfoModal.tsx` renders an explicit notice for users whose `official` flag is `false`:

```tsx
{user.official === false && <p className="mt-4 mb-0">＊ 非正式参加者</p>}
```

The visible contract is the exact text, a 16px top margin, and no bottom margin.

## Current Vue Gap

`src/client/components/rankland-ranklist.vue` renders the same text, but reuses `rankland-user-modal-line`:

```vue
<p v-if="activeUserPayload.user.official === false" class="rankland-user-modal-line">
  ＊ 非正式参加者
</p>
```

That class currently applies `margin: 4px 0`, which does not match the old `mt-4 mb-0` spacing. The element also lacks a stable `data-id`, so the old contract is not covered by full-chain tests.

## Scope

- Make Team Beta explicitly unofficial in the full-chain ranklist fixture.
- Add full-chain coverage by opening Team Beta's user modal and asserting the unofficial line text and computed margins.
- Add a stable `data-id` and old-style class to the Vue unofficial line.
- Restore `margin-top: 16px` and `margin-bottom: 0` for that line only.
- Update migration status after verification.

## Non-Goals

- No changes to official-only filtering semantics.
- No changes to user modal organization, team members, marker labels, segment labels, photo, slogan, or rank-time chart.
- No generated router changes.

## Test Strategy

Use `/ranklist/:id` full-chain coverage. Open Team Beta's user modal after Team Alpha assertions, verify `＊ 非正式参加者`, and assert computed `margin-top: 16px` and `margin-bottom: 0px`.

## Acceptance Criteria

- Focused ranklist full-chain test fails before implementation because the stable unofficial selector is absent and spacing is still generic.
- Focused ranklist full-chain test passes after implementation.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- `docs/migration/status.md` records this verified slice.
