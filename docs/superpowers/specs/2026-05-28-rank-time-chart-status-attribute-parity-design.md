# Rank-Time Chart Status Attribute Parity Design

## Goal

Restore the old React `RankCurve` outer wrapper DOM more precisely by removing the Vue-only `data-chart-status` attribute from the rank-time chart wrapper while preserving stable migration hooks and G2 rendering coverage.

## Legacy Evidence

Old React `rankland-fe/src/components/RankCurve.tsx` renders:

```tsx
return (
  <div>
    <div ref={container} style={{ height: '400px' }} />
  </div>
);
```

The outer wrapper is plain and does not expose a chart lifecycle/status attribute.

## Current Gap

The migrated Vue chart currently renders:

```vue
<div
  data-id="rankland-rank-time-curve"
  :data-chart-status="chartStatus"
  :style="{ height: `${chartModel.containerHeight}px` }"
>
```

`data-id` is an accepted migration probe, but `data-chart-status` is a Vue-only product DOM attribute and is not required by tests or user-facing behavior.

The shared ranklist wrapper also still contains a stale `.rankland-rank-time-curve` style rule after the chart wrapper class was removed. That rule no longer matches rendered DOM and should be deleted as cleanup in this slice.

## Target Behavior

- `[data-id="rankland-rank-time-curve"]` remains visible.
- `[data-id="rankland-rank-time-curve"]` keeps no product `class` token.
- `[data-id="rankland-rank-time-curve"]` does not render `data-chart-status`.
- The G2 chart metadata/canvas, relative wrapper layout, and 400px chart height remain covered.
- `src/client/components/rankland-ranklist.vue` no longer carries stale `.rankland-rank-time-curve` CSS.

## Non-Goals

- Do not remove accepted `data-id` hooks.
- Do not remove G2 metadata attributes used by full-chain parity probes.
- Do not change chart lifecycle, theme updates, error handling, tooltip, or animation behavior.
- Do not broaden into SRK lower-level table pixel parity.

## Verification

- Focused RED/GREEN: `corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page"`
- Full gate: `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`
