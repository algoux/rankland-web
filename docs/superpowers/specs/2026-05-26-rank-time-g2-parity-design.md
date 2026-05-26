# Rank-Time G2 Parity Design

## Goal

Replace the temporary SVG rank-time curve in the shared Vue `RanklandRanklist` user modal with a browser-only `@antv/g2` chart that matches the old React `RankCurve` tooltip and animation behavior.

## Source Behavior

The old React component at `rankland-fe/src/components/RankCurve.tsx` uses `@antv/g2@^5.0.13` and renders:

- a chart container with `height: 400px`;
- a line chart over rank-time points with `x=time`, `y=rank`, x-axis title `时间（${unit}）`, y-axis title `主排名`, and y ticks `[1, 50, 100, ...maxRank]`;
- tooltip title formatted with `secToTimeStr(formatTimeDuration([time, unit], 's'))`;
- tooltip items `主排名` and `解题数`;
- `pathIn` enter animation for the rank line with duration `2000`;
- rank-series segment `area()` layers with `fillOpacity: 0.3` and segment range tooltips;
- solved-event `text()` badge layers with `zoomIn` enter animation, duration `200`, and delay `(event.time / maxTime) * 2000 + 200`;
- dark/light theme updates and tooltip crosshair color changes.

## Scope

This slice includes:

- a framework-neutral chart-model helper that captures the old RankCurve constants, max-rank/tick calculation, tooltip text, and solved-event animation timing;
- a Vue rank-time chart component that dynamically imports `@antv/g2` only in the browser and renders the old line, area, badge, tooltip, animation, and theme behavior;
- replacement of the inline SVG curve in `rankland-ranklist.vue` with the G2-backed component while keeping existing modal data, summary, and solved-event text;
- focused unit tests for the chart-model helper and full-chain coverage that the modal renders a G2 chart container and exposes the legacy tooltip/animation metadata.

## Non-Goals

This slice does not change rank-time data calculation, user modal content outside the chart, SRK table rendering, export/share behavior, or collection remaining-height behavior.

## SSR/CSR Boundary

`@antv/g2` must not be imported during SSR. The new component receives already-computed rank-time data and creates/destroys a G2 `Chart` inside Vue lifecycle hooks. If the import or chart render fails, the component exposes an error status for tests and keeps the rest of the user modal usable.

## Acceptance Criteria

- The user modal rank-time panel renders a 400px G2 chart area instead of the temporary SVG curve.
- Unit tests prove the old RankCurve tooltip labels, y ticks, `pathIn` duration, and solved badge `zoomIn` delay math.
- Full-chain E2E proves `Team Alpha` opens a rank-time chart with legacy G2 metadata and no horizontal overflow.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
