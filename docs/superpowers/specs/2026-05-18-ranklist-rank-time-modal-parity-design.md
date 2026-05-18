# Ranklist Rank-Time Modal Parity Design

## Goal

Port the old React `UserInfoModal` rank-time detail into the shared Vue `RanklandRanklist` wrapper so `/ranklist/:id` and `/live/:id` users can inspect a team's rank progression from the user modal.

## Source Behavior

The old React `StyledRanklistRenderer` lazily computes rank-time data when a user is clicked. It uses the SRK solutions to regenerate contest snapshots at a duration-dependent time unit, selects the clicked user's main ICPC series, and renders a `RankCurve` inside the custom `UserInfoModal` for official users.

## Scope

This slice includes:

- port the rank-time data helper into a framework-neutral client helper;
- keep the calculation lazy and local to the shared Vue wrapper;
- replace the default Vue user modal with a custom modal that preserves the default user details and adds a rank-time panel;
- render a lightweight SVG rank curve and solved-event summary without introducing `@antv/g2`;
- cover the pure helper with unit tests and the visible modal detail with full-chain E2E.

## Non-Goals

This slice does not migrate SRK asset URL rewriting, exact G2 tooltip/animation parity, converter-backed exports, global focus layout/nav behavior, or a broader visual redesign of the modal.

## Data Flow

`RanklandRanklist` receives the original SRK ranklist. On user click it opens the custom modal and computes rank-time data from the current ranklist:

1. collect sorted calculated solutions from SRK rows;
2. choose a rank-time chunk unit based on contest duration;
3. regenerate static snapshots over the contest timeline;
4. select the clicked user's main ICPC series, honoring the active marker filter;
5. render the selected points, solved event markers, and segment ranges in the modal.

The helper is pure and cross-runtime safe. The component only reads it in user-click handling/computed state, so SSR output is unaffected.

## Test Strategy

Unit tests:

- duration-to-unit selection matches the legacy thresholds;
- rank-time data can be computed from the deterministic SRK fixture;
- `Team Alpha` receives minute-based points and solved-event aliases `A` and `B`;
- marker-scoped selection returns `null` when the selected marker does not belong to the user.

Full-chain E2E:

- `/live/live-test-key` opens the user modal for `Team Alpha`;
- the modal shows the rank-time panel, current unit, solved events, and SVG curve.

## Acceptance Criteria

- User modal clicks still work for live and ranklist routes.
- Official users with ICPC rank-time data show rank progression details.
- Focused unit and full-chain tests pass.
- `corepack pnpm test:migration` and `git diff --check` pass before commit.
