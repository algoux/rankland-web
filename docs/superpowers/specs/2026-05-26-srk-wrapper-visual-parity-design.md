# SRK Wrapper Visual Parity Design

## Goal

Close the next product-review-driven `StyledRanklistRenderer` parity slice by restoring legacy header metadata, hover dropdown behavior, and collection route wrapper controls in the shared Vue `RanklandRanklist` component.

## Source Behavior

The old React `StyledRanklistRenderer` rendered a centered contest header with:

- optional view count from `meta.viewCnt`;
- export and share actions as Ant Design hover dropdowns;
- contributor links from `ranklist.contributors`;
- up to three visible contest reference links plus a hover dropdown for remaining links;
- contest time range below the metadata.

The old `/collection/:id?rankId=...` page also passed selected ranklists through `StyledRanklist` with `meta`, `showFooter`, and `showFilter`. It did not render a separate route-level title above a bare table.

## Target Behavior

In `rankland-web`:

- `/ranklist/:id` passes `ranklist.info` as wrapper `meta`;
- `/collection/:id?rankId=...` uses the same wrapper header, filter, progress, footer, and `meta` path as `/ranklist/:id`;
- export/share dropdowns open on hover through Ant Design Vue dropdown/menu primitives and close after hover leaves;
- wrapper header shows `浏览 42` for the mock ranklist info;
- wrapper header shows contributors and contest reference links when the SRK contains them;
- if more than three reference links exist, only the first three are inline and the rest are available from a hover dropdown labelled `and N more`;
- all behavior remains SSR-safe: browser side effects stay inside click handlers, and Ant Design Vue dropdowns are client-hydration compatible in the shared wrapper.

## Non-Goals

- Do not change converter-backed export file generation.
- Do not replace the rank-time modal with the old `@antv/g2` chart.
- Do not add Live Toastify animation or pixel parity.
- Do not make a broad table renderer package change.

## Test Strategy

Full-chain E2E:

- `/ranklist/test-key?focus=yes` renders view count, hover-open export/share dropdowns, contributors, and reference links;
- moving away from the export button closes the hover dropdown;
- the fourth reference link is hidden behind the `and 1 more` hover dropdown;
- `/collection/official?rankId=test-key` renders selected ranklists through the shared wrapper header/filter/progress/footer and exposes wrapper actions and view count.

The mock SRK fixture will include deterministic contributors and four reference links so the header parity can be tested through the real full-chain app.

## Acceptance Criteria

- Focused full-chain ranklist and collection tests fail before implementation and pass after implementation.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- `docs/migration/status.md` records this SRK wrapper parity slice and the updated remaining risks.
