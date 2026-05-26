# Home Ant Design Content Parity Design

## Goal

Close the Home SEO/content polish queue item by restoring the old React home page's Ant Design card layout for recommendation and tool sections while preserving SSR statistics, SEO head output, JSON-LD, contact modal, and route compatibility.

## Source Behavior

The old React `rankland-fe/src/pages/index.tsx` home page used Ant Design `Row`, `Col`, and hoverable `Card` components for:

- `为你推荐`: `探索` and `榜单合集`;
- `算竞周边工具`: `paste.then.ac` and `Algo Bootstrap`.

Those cards kept the same destinations, product copy, logo assets, and statistics interpolation that the Vue foundation already migrated.

## Target Behavior

In `rankland-web`:

- the four Home cards render as Ant Design Vue cards with `.ant-card`;
- recommendation and tool sections use Ant Design Vue grid wrappers with `.ant-row` and `.ant-col`;
- existing `data-id` selectors and hrefs stay stable;
- SSR still renders the RankLand intro, statistics values, canonical/OG/JSON-LD head output, and contact/about content;
- no route metadata or upstream API behavior changes.

## Non-Goals

- Do not redesign Home beyond the legacy Ant Design card/grid shape.
- Do not change app shell navigation or focus-mode behavior.
- Do not introduce new data dependencies beyond `/statistics`.
- Do not add broader SEO metadata not present in the old React page.

## Test Strategy

Full-chain E2E will assert:

- `/` SSR HTML and hydrated page still expose the existing statistics and links;
- recommendation and tool sections contain Ant Design Vue `.ant-row`, `.ant-col`, and `.ant-card` elements;
- recommendation links keep `/search` and `/collection/official`;
- tool links keep the old external URLs.

Existing Home full-chain screenshot/viewport coverage remains the layout guard.

## Acceptance Criteria

- RED full-chain Home test fails on the current custom card/grid implementation.
- Focused Home full-chain passes after implementation.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass.
- `docs/migration/status.md` records the verified Home Ant Design content parity slice.
