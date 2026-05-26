# Rank-Time G2 Parity Implementation Plan

Implement the old React `RankCurve` G2 tooltip and animation behavior in the Vue shared ranklist wrapper.

## File Map

- Modify `package.json` and `pnpm-lock.yaml` to add `@antv/g2`.
- Modify `src/client/components/rankland-rank-time.ts` with chart-model helpers.
- Add `src/client/components/rankland-rank-time-chart.vue`.
- Modify `src/client/components/rankland-ranklist.vue` to use the chart component.
- Modify `tests/unit/rankland-rank-time.spec.ts`.
- Modify `tests/e2e/full-chain/live.spec.ts`.
- Update `docs/migration/status.md` and `docs/migration/manual-acceptance-checklist.md`.

## Tasks

- [x] Add RED unit tests for legacy G2 chart model: 400px height, y ticks, tooltip text/items, line `pathIn` animation, and solved badge `zoomIn` delay.
- [x] Add RED full-chain assertions for a G2-backed rank-time chart in the user modal.
- [x] Add `@antv/g2` dependency matching the old frontend major/minor behavior.
- [x] Implement chart-model helpers in `rankland-rank-time.ts`.
- [x] Implement browser-only `rankland-rank-time-chart.vue` using dynamic `@antv/g2` import.
- [x] Replace the inline SVG in `rankland-ranklist.vue` with the G2 chart component.
- [x] Run focused unit and full-chain gates.
- [x] Run `gen:client-router`, `test:migration`, and `git diff --check`.
- [x] Update migration docs.
