# User Modal Rank-Time Chrome Parity Design

## Context

The old React `UserInfoModal` renders official-user rank-time data as a plain `div.mt-4` wrapper containing only `RankCurve`. `RankCurve` owns the visible chart surface and fixes the chart container height at `400px`.

The Vue migration currently adds extra product chrome around the same chart:

- `h4` text `排名时间`;
- a visible `单位：min` line;
- a current-rank summary paragraph;
- solved-event chips;
- a `20px` top margin, `16px` top padding, and a slate border.

Those additions are not present in the old React product surface. Existing tests already verify the important old chart behavior, including G2 rendering, tooltip metadata, animation metadata, and the `400px` curve height.

## Decision

Restore the old modal chrome by keeping only a rank-time wrapper and the `RanklandRankTimeChart` component. The wrapper may keep `data-id="rankland-rank-time-panel"` as a stable full-chain selector, but its presentation must match old `mt-4`: `margin-top: 16px`, with no top padding and no border.

Remove the Vue-only rank-time header, unit text, summary paragraph, and solved-event chips from the DOM and delete their local CSS.

## Non-Goals

- Do not change rank-time data calculation.
- Do not change G2 chart options, tooltip labels, animation metadata, or lazy import behavior.
- Do not change unrelated user modal rows, markers, slogan, photo, or segment styles.

## Test Strategy

Use the existing live full-chain modal path because it opens an official user with rank-time data. Update the regression to assert:

- the panel is visible;
- `rankland-rank-time-unit`, `rankland-rank-time-summary`, and `rankland-rank-time-event` do not exist;
- the panel computes `margin-top: 16px`, `padding-top: 0px`, and `border-top-width: 0px`;
- existing G2 chart, tooltip, animation, canvas, and `400px` height assertions still pass.

## Acceptance Criteria

- Focused live full-chain test fails before implementation with visible Vue-only chrome.
- Focused live full-chain test passes after implementation.
- Full migration gate passes.
- Migration status, manual acceptance checklist, and final integration review mention the restored rank-time modal chrome.
