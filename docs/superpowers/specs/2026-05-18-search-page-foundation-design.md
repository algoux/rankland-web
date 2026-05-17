# Search Page Foundation Design

## Goal

Migrate the public `/search` page from `rankland-fe` into `rankland-web` as a CSR Vue route with the same externally visible search behavior: `kw` query support, recent-list fallback, Fuse-backed client search, stable result selectors, and links to `/ranklist/:id`.

## Source Behavior

Source file:

- `rankland-fe/src/pages/search/index.tsx`

The React page:

- reads `kw` from the URL query;
- calls `api.listAllRanklists()` after client mount;
- builds a Fuse index over `allData.ranks` with keys `name` and `uniqueKey`, threshold `0.3`;
- shows an Ant Design search input whose submit updates the route to `/search?kw=<value>`;
- shows loading and initialization error states while fetching all ranklists;
- with a non-empty `kw`, renders `[data-id="search-result-section"]` with `data-result-count`;
- with an empty `kw`, renders `[data-id="search-recent-section"]` and the first 10 ranklists;
- renders each row with `[data-id="search-ranklist-item"]`, `[data-id="search-ranklist-link"]`, and `data-ranklist-key`;
- links each result to `/ranklist/:uniqueKey`;
- formats `createdAt` as `YYYY-MM-DD HH:mm`;
- uses title `探索 - RankLand`.

## Target Route Decision

`/search` is a CSR route.

Rationale:

- `docs/migration/inventory.md` marks `/search` as CSR;
- the old page has no server data-loading path and searches only after client mount;
- the data source is `listAllRanklists()`, then local Fuse search, so SSR would either duplicate a browser-only flow or add behavior the source page does not have;
- SEO-sensitive ranklist and collection detail routes remain SSR, while search is an interactive exploration workflow.

This slice should update the shared route contract so `ranklandRoutes.search.ssr === false`. Generated Vue router output should come from `corepack pnpm run gen:client-router`, not hand edits.

## Data Flow

The Vue search page will:

1. mount as a CSR route;
2. read the normalized `kw` query from `this.$route.query.kw`;
3. call `RanklandApiService.listAllRanklists()` once on mount;
4. store `ranklists`, `loading`, and `loadError` in local component state;
5. derive `searchRows` with Fuse when `kw` is non-empty;
6. derive `recentRows` from the first 10 `ranklists` when `kw` is empty;
7. update the URL through `ranklandRoutes.search.build({ kw })` when the user submits the search input;
8. render links through `ranklandRoutes.ranklist.build({ id: item.uniqueKey })`.

The page must not call `searchRanklist()` during this foundation slice. The source page preserves search parity by loading the full ranklist list and searching locally with Fuse.

## Components And Helpers

Create `src/client/modules/search/search-result.ts` for pure behavior:

- `normalizeSearchKeyword(value)` returns a single trimmed keyword from route query input;
- `searchRanklists(ranklists, kw)` returns Fuse matches for non-empty keywords;
- `getRecentRanklists(ranklists, limit = 10)` returns the first `limit` entries;
- `formatSearchCreatedAt(value)` renders `YYYY-MM-DD HH:mm` for row metadata.

Create `src/client/modules/search/search.view.vue` for route UI and RanklandApiService wiring.

Keep the initial UI simple and migration-equivalent. This slice is not a redesign and should avoid unrelated layout work.

## UI Contract

Stable selectors:

```text
data-id="search-page"
data-id="search-input"
data-id="search-submit"
data-id="search-loading"
data-id="search-error"
data-id="search-result-section"
data-id="search-result-count"
data-id="search-recent-section"
data-id="search-empty-state"
data-id="search-ranklist-item"
data-id="search-ranklist-link"
data-id="search-hydrated"
```

Stable attributes:

- `[data-id="search-result-section"]` carries `data-result-count`;
- each `[data-id="search-ranklist-item"]` carries `data-ranklist-key`;
- each `[data-id="search-ranklist-link"]` carries `data-ranklist-key` and `href="/ranklist/:uniqueKey"`.

Text parity:

- heading: `在榜单数据库中探索`;
- input placeholder: `输入关键词搜索`;
- result summary: `搜索到 N 个结果`;
- recent heading: `最近更新`;
- empty recent state: `暂无最近更新的榜单`;
- load error: `初始化榜单数据库失败，请刷新再试。`;
- row metadata: `创建于 YYYY-MM-DD HH:mm`.

## Error And Empty States

Before the list request resolves:

- show `[data-id="search-loading"]`;
- do not show stale rows.

If `listAllRanklists()` fails:

- show `[data-id="search-error"]`;
- keep the search input available so the user can keep or change the URL query;
- do not render result or recent rows from partial data.

If `kw` is non-empty and Fuse returns no matches:

- show `[data-id="search-result-section"][data-result-count="0"]`;
- show `搜索到 0 个结果`;
- show `[data-id="search-empty-state"]`.

If `kw` is empty and `ranklists` is empty:

- show `[data-id="search-recent-section"]`;
- show `暂无最近更新的榜单`.

## SEO And Head

Because `/search` is CSR, server-rendered HTML is not expected to contain the API-loaded ranklist rows. The page should still set browser head metadata after client render:

- title: `探索 - RankLand`;
- `og:title`: `探索 - RankLand`;
- canonical path: `/search` for empty query and `/search?kw=<encoded>` for keyword searches.

No JSON-LD is required for this route. The home page already emits the site-level `SearchAction`.

## Route And Dependency Changes

Add `fuse.js` as a runtime dependency because the source page uses Fuse and the target package does not currently include it.

Route updates:

- add `src/client/modules/search/search.view.vue`;
- regenerate client router files;
- update `src/common/rankland-router/routes.ts` so `search.ssr` is `false`;
- update route unit tests to expect CSR for search.

Generated files must only be changed by `corepack pnpm run gen:client-router`.

## Test Strategy

Unit tests:

- `normalizeSearchKeyword` trims strings and ignores non-string route values;
- `getRecentRanklists` returns the first 10 entries;
- `searchRanklists` finds matches by `name`;
- `searchRanklists` finds matches by `uniqueKey`;
- empty keyword returns no search rows;
- route contract confirms `ranklandRoutes.search.build()` encodes `kw` and `ranklandRoutes.search.ssr === false`.

Full-chain E2E:

- `/search` renders CSR shell, hydrates, calls `/rank/listall`, shows recent rows, and links the first row to `/ranklist/test-key`;
- `/search?kw=Test` calls `/rank/listall`, renders result count `1`, and links the matching row to `/ranklist/test-key`;
- `/search?kw=` behaves like empty query and shows the recent section;
- full-chain search coverage asserts no `/rank/search` request is made.

Narrow E2E with `tests/e2e/helpers/mock-api.ts` can cover browser navigation and route query behavior without the full-chain app when useful, but the acceptance gate for this slice is full-chain behavior.

## Acceptance Criteria

- `/search` is present in generated client/common router maps as a CSR route.
- `/search` calls `RanklandApiService.listAllRanklists()` through the existing client API plugin.
- `/search` does not call `searchRanklist()` or upstream `/rank/search`.
- Empty query shows recent rows from `/rank/listall`.
- Non-empty `kw` shows Fuse-filtered rows and result count.
- Result links target `/ranklist/:uniqueKey`.
- Stable data selectors match this spec.
- `corepack pnpm test:migration` passes with no skipped gates.

## Known Risks

- Adding `fuse.js` updates `package.json` and `pnpm-lock.yaml`; this should stay scoped to the dependency addition.
- Time formatting must avoid timezone-sensitive assertions in E2E. Unit tests can use inputs that produce deterministic local formatting.
- The older API-routing design listed search as SSR, but the current inventory, old React behavior, and user migration brief all specify CSR. This spec treats CSR as the authoritative decision for `/search`.
