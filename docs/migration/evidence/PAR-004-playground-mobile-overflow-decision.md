# PAR-004 Evidence — Playground mobile old overflow behavior decision

## Finding

Desktop Playground layout parity is covered, but mobile intentionally keeps the migrated no-horizontal-overflow guard rather than reproducing old fixed-width overflow.

## Evidence

- Old source: `/Users/cooper/Projects/RankLand/rankland-fe/src/components/SrkPlayground.tsx` renders `.srk-playground-container` and `.srk-playground-preview` with the old fixed editor/preview structure.
- New source: `src/client/modules/playground/playground.view.vue` preserves the desktop `.srk-playground-container` / `.srk-playground-preview` contract and adds responsive rules under `@media (max-width: 900px)`.
- `tests/e2e/full-chain/playground.spec.ts` asserts desktop `display: flex`, no `max-width` cap, editor width `500px`, and also asserts no horizontal document overflow on mobile.
- `docs/superpowers/specs/2026-05-27-playground-flex-layout-parity-design.md` says not to claim exact old mobile overflow behavior because current product gates require no horizontal overflow.
- `docs/migration/final-integration-review.md` records that mobile keeps the migrated no-horizontal-overflow guard.

## Reproduction / Audit Path

1. Render old and new Playground at mobile `390x844`.
2. Compare `document.documentElement.scrollWidth` and visible editor/preview bounds.
3. Keep current behavior unless Cooper explicitly wants old fixed-width mobile overflow restored.

## Current Classification

`wontfix`: current migration docs intentionally prefer mobile usability/no-overflow over exact old mobile overflow behavior.
