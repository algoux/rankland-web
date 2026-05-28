# User Modal Segment Line Product Class Parity Design

## Context

Old React `rankland-fe/src/components/UserInfoModal.tsx` renders the user award-segment line as:

```tsx
<p className="mt-4 mb-0">
  所在奖区（{matchedMainSeries.title}）：
  <span className={`user-modal-segment-label bg-segment-${matchedSeriesSegment.style}`}>
    {matchedSeriesSegment.title}
  </span>
</p>
```

The Vue SRK wrapper currently renders the same product line with extra migration-only classes:

```vue
<p
  data-id="rankland-user-modal-segment"
  class="rankland-user-modal-line rankland-user-modal-segment mt-4 mb-0"
>
```

This keeps the visual spacing correct, but it does not match the old React product class contract because the visible product DOM still exposes `rankland-user-modal-line` and `rankland-user-modal-segment`.

## Scope

Restore exact old React class parity for `[data-id="rankland-user-modal-segment"]`:

- render exact `class="mt-4 mb-0"`;
- remove Vue-only `rankland-user-modal-line`;
- remove Vue-only `rankland-user-modal-segment`;
- preserve segment text, segment label DOM/classes, and existing 16px top / 0px bottom margin behavior;
- keep the stable `data-id` test/style hook.

## Non-Goals

- Do not change segment label class parity in this slice.
- Do not change user modal photo, slogan, marker, unofficial, team member, or rank-time rows.
- Do not remove `.rankland-user-modal-line` globally unless no other current row needs it.
- Do not change SRK data selection, rank-time data, or modal open/close behavior.

## Test Strategy

Update `tests/e2e/full-chain/ranklist.spec.ts` before implementation:

- assert `[data-id="rankland-user-modal-segment"]` has exact class list `mt-4 mb-0`;
- assert the class list does not contain `rankland-user-modal-line`;
- assert the class list does not contain `rankland-user-modal-segment`;
- keep existing segment text, label, and computed margin assertions.

Expected RED: the focused Ranklist full-chain test fails because Vue still emits `rankland-user-modal-line rankland-user-modal-segment mt-4 mb-0`.

Expected GREEN: the focused test and full Ranklist full-chain file pass after the Vue template and scoped styles use exact old React classes plus stable `data-id`-scoped CSS.

## Acceptance Criteria

- `[data-id="rankland-user-modal-segment"]` renders exact `mt-4 mb-0`.
- Segment line text remains `所在奖区（Rank）：`.
- Segment label remains `user-modal-segment-label bg-segment-gold` for the deterministic fixture.
- Computed segment-line margins remain `16px` top and `0px` bottom.
- `corepack pnpm test:migration` and `git diff --check` pass before commit.
