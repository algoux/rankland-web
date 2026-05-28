# Rank-Time Chart Wrapper Class Parity Design

## Goal

Restore the legacy RankCurve wrapper DOM contract for the user modal rank-time chart by removing Vue-only product classes from the chart wrapper and G2 container while preserving the migration-only `data-id` probes and chart behavior.

## Legacy Evidence

- Old React `rankland-fe/src/components/RankCurve.tsx` rendered a plain outer `<div>` and a plain inner chart `<div ref={container} style={{ height: '400px' }} />`.
- The old RankCurve wrapper and chart container did not render `rankland-rank-time-curve` or `rankland-rank-time-g2-chart` class tokens.
- The current Vue migration added those product classes only to support local styling and probes.

## Target Behavior

- `[data-id="rankland-rank-time-curve"]` stays visible and keeps a computed height of `400px`.
- `[data-id="rankland-rank-time-curve"]` does not render a product `class` token.
- `[data-id="rankland-rank-time-g2-chart"]` stays visible and keeps the G2 metadata/canvas behavior.
- `[data-id="rankland-rank-time-g2-chart"]` does not render a product `class` token.
- Styles needed for layout move to scoped `data-id` selectors so test probes remain stable without changing product DOM parity.

## Non-Goals

- Do not change G2 data, tooltip, animation, theme, or canvas rendering.
- Do not remove the existing error message element or its styling in this slice.
- Do not change user modal panel classes, which are covered by a separate slice.

## Verification

- Focused RED/GREEN: `corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page"`
- Full gate: `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`
