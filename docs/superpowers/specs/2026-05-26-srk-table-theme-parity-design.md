# SRK Table Theme Parity Design

## Goal

Restore old React SRK renderer theme propagation for the low-level ranklist table.

## Old React Baseline

`rankland-fe/src/components/StyledRanklistRenderer.tsx` reads the global RankLand theme and passes it into the low-level SRK renderer:

```tsx
const { theme } = useModel('theme');

<Ranklist
  data={usingData}
  theme={theme as EnumTheme}
  stripedRows
  formatSrkAssetUrl={(url: string) => formatSrkAssetUrl(url, id)}
  onUserClick={handleUserClick}
  onSolutionClick={handleSolutionClick}
/>
```

The Vue SRK package exposes the same `theme` prop. It affects problem header gradients, marker presentation, and themed inline styles from SRK data.

## Current Vue Gap

`src/client/components/rankland-ranklist.vue` does not pass `theme`, so the low-level SRK table stays on its light default even when the app shell applies `html.dark`.

## Scope

- Track the current document theme inside `RanklandRanklist` from `document.documentElement.classList`.
- Observe html `class` mutations so theme changes after hydration update the SRK table.
- Pass the resolved `light` / `dark` value to the low-level Vue `<Ranklist />`.
- Add deterministic full-chain coverage using a theme-dependent fixture problem header color.

## Non-Goals

- No changes to app-shell theme bootstrap or media-query behavior.
- No changes to G2 rank-time chart theme handling.
- No manual CSS override of SRK table colors.
- No generated router changes.

## Test Strategy

Use `/ranklist/:id` full-chain coverage. Stub `window.matchMedia('(prefers-color-scheme: dark)')` before navigation so the app shell applies `html.dark`. The ranklist fixture uses a different dark background color for Problem A. The RED assertion checks the rendered `.srk-problem-header` background image contains the dark RGB value. Current Vue should fail because no `theme` prop is passed to the low-level renderer.

## Acceptance Criteria

- Focused full-chain test fails before implementation for the expected dark SRK problem header color.
- Focused full-chain test passes after implementation.
- Existing light-mode ranklist full-chain behavior remains green.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- `docs/migration/status.md` records this verified slice.
