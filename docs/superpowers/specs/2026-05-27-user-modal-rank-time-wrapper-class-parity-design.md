# User Modal Rank-Time Wrapper Class Parity Design

## Goal

Restore the old React user modal rank-time wrapper utility class token in the Vue SRK wrapper without changing G2 chart rendering, rank-time data, or the chart-only modal chrome.

## Source Behavior

`rankland-fe/src/components/UserInfoModal.tsx` renders the official-user rank-time chart inside:

```tsx
{user.official && rankTimeData.initialized && (
  <div className="mt-4">
    <RankCurve ... />
  </div>
)}
```

The current Vue wrapper already keeps equivalent computed top spacing through `.rankland-rank-time-panel`, but it does not expose the old `mt-4` class token on the rank-time panel.

## Target Behavior

`src/client/components/rankland-ranklist.vue` should render the rank-time panel with:

```html
class="rankland-rank-time-panel mt-4"
```

The migrated hook remains responsible for local styles. The old utility class token is restored for DOM parity with `rankland-fe` and for downstream visual review selectors.

## Non-Goals

- Do not change `RanklandRankTimeChart` rendering or G2 configuration.
- Do not change rank-time data derivation, tooltip metadata, animation metadata, or chart height.
- Do not add unit, summary, solved-event chips, or any chrome removed by previous chart-only parity slices.

## Test Strategy

Extend the existing live full-chain user modal rank-time assertions because that scenario already opens an official user modal with rank-time data and checks chart-only behavior.

The test should:

- verify `[data-id="rankland-rank-time-panel"]` carries `mt-4`;
- keep the existing computed style coverage for `margin-top: 16px`, `padding-top: 0px`, and `border-top-width: 0px`;
- keep the existing no-extra-chrome and G2 chart assertions.

Use TDD: the focused live full-chain test must fail before implementation because the current rank-time panel lacks `mt-4`, then pass after the Vue template change.

## Acceptance Criteria

- Focused live full-chain test fails RED for missing `mt-4` before production code changes.
- Focused live full-chain test passes GREEN after implementation.
- Full migration gate passes after docs are updated.
- Migration dashboard, manual acceptance checklist, and final integration review mention rank-time wrapper class parity.
