# User Modal Unofficial Line Product Class Parity Design

## Context

Old React `rankland-fe/src/components/UserInfoModal.tsx` renders the non-official notice line as:

```tsx
{user.official === false && <p className="mt-4 mb-0">＊ 非正式参加者</p>}
```

The Vue SRK wrapper currently renders the same product line with an extra migration-only class:

```vue
<p
  v-if="activeUserPayload.user.official === false"
  data-id="rankland-user-modal-unofficial"
  class="rankland-user-modal-unofficial mt-4 mb-0"
>
```

This preserves spacing, but the visible product DOM still exposes `rankland-user-modal-unofficial`, which was not present in old React.

## Scope

Restore exact old React class parity for `[data-id="rankland-user-modal-unofficial"]`:

- render exact `class="mt-4 mb-0"`;
- remove Vue-only `rankland-user-modal-unofficial`;
- preserve the text `＊ 非正式参加者`;
- preserve existing 16px top / 0px bottom margin behavior;
- keep the stable `data-id` test/style hook.

## Non-Goals

- Do not change user modal organization, team members, markers, segment, photo, slogan, or rank-time rows.
- Do not remove other migrated user modal product classes.
- Do not change official-user visibility semantics.
- Do not change SRK data selection, modal open/close behavior, or dark-mode body text color.

## Test Strategy

Update `tests/e2e/full-chain/ranklist.spec.ts` before implementation:

- assert `[data-id="rankland-user-modal-unofficial"]` has exact class list `mt-4 mb-0`;
- assert the class list does not contain `rankland-user-modal-unofficial`;
- keep existing text and computed margin assertions.

Expected RED: the focused Ranklist full-chain test fails because Vue still emits `rankland-user-modal-unofficial mt-4 mb-0`.

Expected GREEN: the focused test and full Ranklist full-chain file pass after the Vue template and scoped styles use exact old React classes plus stable `data-id`-scoped CSS.

## Acceptance Criteria

- `[data-id="rankland-user-modal-unofficial"]` renders exact `mt-4 mb-0`.
- The line still renders only for non-official users.
- Text remains `＊ 非正式参加者`.
- Computed margins remain `16px` top and `0px` bottom.
- `corepack pnpm test:migration` and `git diff --check` pass before commit.
