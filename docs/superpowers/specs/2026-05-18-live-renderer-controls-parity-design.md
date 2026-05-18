# Live Renderer Controls Parity Design

## Goal

Move the migrated `/live/:id` page beyond the foundation SRK table by porting the old `StyledRanklist` wrapper behavior that the live route depends on: contest header, progress bar, filter controls, extra action area, and footer.

## Source Behavior

The old React live page calls `StyledRanklist` with:

- `showFilter`
- `showProgress`
- `showFooter`
- `isLive`
- `renderExtraActionArea` for the scroll-solution switch on desktop

`StyledRanklistRenderer` then:

- converts SRK into a static ranklist;
- renders contest title and contest time range;
- renders a time-travel progress bar;
- filters rows by organization, official-only status, and marker;
- recalculates problem statistics after filtering;
- renders a right-side extra action area next to filters;
- renders a RankLand footer below the table.

## Scope

This slice includes the live page's needed wrapper parity only:

- extend `RanklandRanklist` with optional header, progress, filter, footer, live mode, and extra-action slot support;
- keep existing pages unchanged by making those options opt-in;
- update `/live/:id` to pass the options used by the old React page and move the scroll-solution switch into the wrapper action slot;
- add focused unit coverage for filtering/statistics/time-travel state;
- extend full-chain `/live/:id` coverage to prove the controls render and filter the table.

## Non-Goals

This slice does not migrate export/share menus, user detail modals, solution modals, rank-time charts, SRK asset URL rewriting, theme switching, Ant Design visual parity, or full focus-mode layout behavior. The current Vue app does not yet have the old global nav/right-menu layout, so `focus=yes` remains preserved as route/query data.

## Data Flow

`RanklandRanklist` owns local UI state:

1. keep `filter.organizations`, `filter.officialOnly`, `filter.marker`, and `timeTravelTime`;
2. derive raw data from the input SRK and optional time travel;
3. convert the derived SRK into `StaticRanklist`;
4. filter rows and series;
5. recalculate problem statistics for the filtered rows;
6. render the Vue renderer package with the filtered static ranklist.

The live page remains responsible for API loading, polling, WebSocket lifecycle, and query changes.

## Test Strategy

Unit tests:

- `createRanklandRanklistState` filters by organization;
- official-only filtering removes unofficial rows;
- marker filtering filters rows and ICPC marker-scoped series;
- filtered rows recalculate problem statistics;
- time travel regenerates a reduced ranklist before rendering.

Full-chain E2E:

- `/live/live-test-key?token=t0&scrollSolution=1&focus=yes` renders the wrapper header, progress area, filters, action switch, footer, and rows;
- selecting an organization hides the other fixture team while keeping live data loaded;
- existing WebSocket and request assertions still pass.

## Acceptance Criteria

- Live page uses `RanklandRanklist` options equivalent to the old React `StyledRanklist` call.
- Existing non-live ranklist usages continue to render without the new controls unless they opt in.
- Focused unit tests and live full-chain E2E pass.
- `corepack pnpm test:migration` and `git diff --check` pass before commit.
