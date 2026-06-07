# User Modal Segment Label Product Class Parity Design

## Context

Old React `rankland-fe/src/components/UserInfoModal.tsx` renders the user award-segment label as:

```tsx
<span className={`user-modal-segment-label bg-segment-${matchedSeriesSegment.style}`}>
  {matchedSeriesSegment.title}
</span>
```

The Vue SRK wrapper currently keeps the old class, but it also exposes a migration-only product class:

```vue
<span
  data-id="rankland-user-modal-segment-label"
  class="rankland-user-modal-segment-label user-modal-segment-label"
  :class="`bg-segment-${activeUserSegment.segmentStyle}`"
>
```

This preserves the visual style, but product DOM parity is still incomplete because the old React class list did not include `rankland-user-modal-segment-label`.

## Scope

Restore exact old React class parity for `[data-id="rankland-user-modal-segment-label"]`:

- render exact `class="user-modal-segment-label bg-segment-gold"` for the deterministic fixture;
- remove Vue-only `rankland-user-modal-segment-label`;
- preserve label text `Gold`;
- preserve `bg-segment-*` background color behavior;
- preserve inline-block, 4px padding, 4px border radius, and white text style;
- keep stable `data-id` for full-chain assertions and migration diagnostics.

## Non-Goals

- Do not change the award-segment row class parity in this slice.
- Do not change segment selection, rank-time data, or modal open/close behavior.
- Do not change user modal photo, slogan, marker, unofficial, team member, or rank-time rows.
- Do not remove other migration-only classes outside the segment label.

## Test Strategy

Update `tests/e2e/full-chain/ranklist.spec.ts` before implementation:

- assert `[data-id="rankland-user-modal-segment-label"]` has exact class list `user-modal-segment-label bg-segment-gold`;
- assert the class list does not contain `rankland-user-modal-segment-label`;
- keep existing label text coverage;
- add computed-style coverage for display, padding, border radius, and color.

Expected RED: the focused Ranklist full-chain test fails because Vue still emits `rankland-user-modal-segment-label user-modal-segment-label bg-segment-gold`.

Expected GREEN: the focused test and full Ranklist full-chain file pass after the Vue template removes the migration-only class and scoped styles target the stable `data-id` plus old class.

## Acceptance Criteria

- `[data-id="rankland-user-modal-segment-label"]` renders exact old React class tokens.
- Segment label text remains `Gold`.
- Segment label visual style remains inline-block with 4px padding, 4px border radius, white text, and `bg-segment-gold` background.
- `corepack pnpm test:migration` and `git diff --check` pass before commit.
