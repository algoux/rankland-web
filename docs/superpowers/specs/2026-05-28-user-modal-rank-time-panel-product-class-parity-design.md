# User Modal Rank-Time Panel Product Class Parity Design

## Context

Old React `rankland-fe/src/components/UserInfoModal.tsx` renders the user rank-time chart wrapper as a plain utility-class wrapper:

```tsx
{user.official && rankTimeData.initialized && (
  <div className="mt-4">
    <RankCurve ... />
  </div>
)}
```

The Vue migration already restored chart-only chrome and added the old `mt-4` class token, but it still exposes a migration-only product class:

```vue
<div
  v-if="activeUserRankTimeData"
  data-id="rankland-rank-time-panel"
  class="rankland-rank-time-panel mt-4"
>
```

This preserves layout, but product DOM parity is incomplete because old React did not render `rankland-rank-time-panel`.

## Scope

Restore exact old React class parity for `[data-id="rankland-rank-time-panel"]`:

- render exact `class="mt-4"`;
- remove Vue-only `rankland-rank-time-panel`;
- preserve stable `data-id` for full-chain diagnostics;
- preserve chart-only rank-time chrome with no unit, summary, or solved-event chips;
- preserve 16px top margin, zero top padding, zero top border, G2 chart metadata, canvas rendering, and rank-time curve height.

## Non-Goals

- Do not change rank-time data selection, chunk units, or event-point generation.
- Do not change `RanklandRankTimeChart` internals or G2 options.
- Do not change user modal photo/slogan, marker, segment, team, organization, or modal-root nodes.
- Do not remove other Vue-only classes outside the rank-time panel.

## Test Strategy

Update `tests/e2e/full-chain/live.spec.ts` before implementation:

- assert `[data-id="rankland-rank-time-panel"]` has exact class list `mt-4`;
- assert the class list does not contain `rankland-rank-time-panel`;
- keep existing visibility, no-extra-chrome, computed spacing, G2 metadata, canvas, and curve-height coverage.

Expected RED: the focused Live full-chain test fails because Vue still emits `rankland-rank-time-panel mt-4`.

Expected GREEN: the focused Live full-chain test passes after the Vue template removes the migration-only class and scoped styles target the stable `data-id` plus old `mt-4` class.

## Acceptance Criteria

- `[data-id="rankland-rank-time-panel"]` renders exact old React `mt-4` class list.
- The wrapper no longer exposes Vue-only `rankland-rank-time-panel`.
- Rank-time chart-only chrome and G2 chart behavior remain covered and unchanged.
- `corepack pnpm test:migration` and `git diff --check` pass before commit.
