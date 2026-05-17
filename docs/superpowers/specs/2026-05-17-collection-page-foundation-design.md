# Collection Page Foundation Design

## Context

This slice starts from local branch `migration/collection-page-foundation`, created from `docs/add-agents-md` so the root `AGENTS.md` migration working agreement is included.

The current migration stack already has:

- `RanklandApiService` with `getCollection`, `getRanklistInfo`, `getSrkFile`, and `getRanklist`;
- API cache behavior for collection content, ranklist info, and SRK files;
- `ranklandRoutes.collection.build({ id, rankId })`;
- a Vue SRK renderer wrapper in `src/client/components/rankland-ranklist.vue`;
- a full-chain Playwright harness that starts the real bwcx/Koa app server and a controlled local RankLand API backend;
- collection, ranklist info, and SRK fixtures in `tests/fixtures`.

The previous visible route slice migrated:

```text
/ranklist/:id
```

This branch migrates the foundation for the next SEO-sensitive public route:

```text
/collection/:id
```

The test chain must remain:

```text
Playwright -> bwcx/Koa -> SSR/CSR -> RanklandApiService -> controlled API backend/mock
```

Full-chain Playwright tests must not use `page.route` to mock app API responses.

## Goal

Add a foundation version of the collection page that proves a real visible SSR route can load collection data, validate and render a selected ranklist, hydrate in the browser, preserve core URL behavior, and be verified through the existing full-chain E2E harness.

## Non-Goals

This branch does not attempt full old React page parity. These remain later migration slices:

- exact Ant Design menu parity;
- old collection category icons;
- full mobile nav width animation and visual parity;
- exact remaining-height calculation from the old layout hooks;
- theme-specific collection icon behavior;
- complete global RankLand app shell migration;
- full `StyledRanklistRenderer` feature parity beyond the existing Vue ranklist wrapper.

## Existing Source Behavior

The old React page at `rankland-fe/src/pages/collection/[id].tsx`:

- SSR-loads `api.getCollection({ uniqueKey: realId })`;
- maps `official` and `由官方整理和维护的` to the real collection id `official`;
- optionally SSR-loads `api.getRanklist({ uniqueKey: rankId })`;
- checks whether `rankId` exists in the collection tree before showing fetched ranklist data;
- client-replaces invalid `rankId` URLs to `/collection/:id`;
- shows an empty state when no `rankId` is selected;
- opens ancestor directories for the selected ranklist;
- renders the selected ranklist with:
  - `data-id="collection-ranklist-content"`;
  - `data-ranklist-id`;
  - `data-row-count`;
- persists collection nav collapsed state in local storage;
- collapses nav after mobile selection;
- sets title, `og:title`, `og:url`, and canonical URL.

The migration foundation preserves the data contract, public route, SSR behavior, alias mapping, core selected-ranklist behavior, invalid `rankId` replacement, stable test attributes, metadata, and a real Vue SRK table render. It intentionally keeps visual and mobile parity narrow.

## Chosen Approach

Use a thin Vue route page plus small framework-neutral collection helpers.

The page owns route behavior:

- route path;
- SSR `asyncData`;
- page-level collection error and loading states;
- content-level selected-ranklist error state;
- page head metadata;
- stable test attributes;
- simple collection navigation markup.

The helpers own collection tree behavior:

- translate public collection ids to upstream ids;
- collect flat ranklist keys from the collection tree;
- collect ancestor directory keys for the selected `rankId`;
- classify collection and selected-ranklist loading errors.

The existing `RanklandRanklist` wrapper continues to own SRK table rendering.

This is the right scope for the first collection slice because it proves the route, collection API, selected-ranklist API, SSR/hydration, and E2E chain without forcing the old React layout details into the foundation.

## Alternatives Considered

### Full Old Page Parity

This would port Ant Design menu behavior, category icons, persisted collapsed state, mobile width calculations, and theme-specific icon assets in the same branch.

Rejected for this branch because it would mix route/data migration with layout parity and make failures harder to isolate.

### Data-Only Collection Page

This would render collection title and selected ranklist content without a clickable tree.

Rejected because a collection page foundation should prove the main user workflow: inspect the collection tree and choose a ranklist through the public collection URL shape.

### Reuse Old React Component Through an Island

This would mount the old React page or menu inside the Vue app.

Rejected because the migration policy explicitly forbids embedding React in the Vue app. Shared behavior should be ported into Vue components, composables, or framework-neutral utilities.

## Architecture

### Route Module

Create:

```text
src/client/modules/collection/collection.view.vue
```

The module will export a `routeView` for:

```text
/collection/:id
```

with:

```ts
RenderMethodKind.SSR
```

The page should use `asyncData({ ranklandApiService, to })` to fetch:

```ts
const id = String(to.params.id);
const rankId = typeof to.query.rankId === 'string' ? to.query.rankId : undefined;
const realId = normalizeCollectionId(id);
const collection = await ranklandApiService.getCollection({ uniqueKey: realId });
```

If `rankId` is absent, the route returns collection data without fetching a ranklist.

If `rankId` is present, the route first checks whether it exists in the collection tree. Only valid ranklist keys should trigger:

```ts
ranklandApiService.getRanklist({ uniqueKey: rankId })
```

No direct axios, `fetch`, or app API client calls should be added for collection or ranklist data.

### Route Props

Create:

```text
src/common/modules/collection/collection.rpo.ts
```

The RPO should expose the required path param:

```ts
id: string
```

The optional `rankId` remains a query value read from `to.query.rankId`, matching the existing route formatter.

### Collection Helpers

Create:

```text
src/client/modules/collection/collection-tree.ts
src/client/modules/collection/collection-error.ts
```

`collection-tree.ts` should expose:

- `normalizeCollectionId(id: string): string`;
- `getFlatRanklistUniqueKeys(collection: IApiCollection): string[]`;
- `getAncestorDirectoryKeys(collection: IApiCollection, rankId: string): string[]`;
- `isRanklistInCollection(collection: IApiCollection, rankId: string): boolean`.

`collection-error.ts` should classify:

- collection NotFound;
- generic collection load failures;
- selected ranklist load failures.

The selected-ranklist failure should not hide the collection navigation. It only affects the ranklist content area.

### Page Rendering

The foundation layout should be simple and SSR-compatible:

- a collection nav container with stable test ids;
- nested directory and ranklist items rendered from `IApiCollection.root.children`;
- `router-link` targets generated with `ranklandRoutes.collection.build({ id, rankId })`;
- selected state for the current `rankId`;
- content area for empty state, ranklist error, selected ranklist loading mismatch, or selected ranklist render.

Required stable attributes:

```text
data-id="collection-content"
data-id="collection-nav"
data-id="collection-menu-item-${uniqueKey}"
data-collection-key="${uniqueKey}"
data-id="collection-empty-state"
data-id="collection-ranklist-content"
data-ranklist-id="${rankId}"
data-row-count="${rows.length}"
data-id="collection-hydrated"
```

The page may use plain CSS for the foundation. It should avoid importing old Less files directly.

### Invalid `rankId`

When `rankId` is present but not found in the collection tree:

- SSR should not call `getRanklist`;
- SSR should render the collection and empty state;
- returned async data should include `ranklistIdInvalid: true`;
- after hydration, the page should run:

```ts
router.replace(ranklandRoutes.collection.build({ id }))
```

This preserves the old behavior while keeping SSR deterministic and avoiding an unnecessary upstream ranklist request.

### Collapsed Nav Foundation

This slice should include a minimal client-only collapsed state only if it is cheap and local:

- default expanded;
- a button toggles a compact class;
- the value may be stored under `CollectionNavCollapsed` in `localStorage`;
- storage reads and writes must only run in browser lifecycle hooks.

Exact old mobile layout parity is out of scope.

## Data Flow

### SSR Initial Load With Selected Ranklist

1. Browser requests `/collection/official?rankId=test-key`.
2. bwcx/Koa routes the request to the Vue SSR renderer.
3. The collection route `asyncData` maps `official` to `official`.
4. `asyncData` calls `RanklandApiService.getCollection`.
5. The service calls the configured controlled backend:
   - `GET /rank/group/official`.
6. `asyncData` confirms `test-key` exists in the collection fixture.
7. `asyncData` calls `RanklandApiService.getRanklist`.
8. The service calls the configured controlled backend:
   - `GET /rank/test-key`;
   - `GET /file/download?id=file-test-1`.
9. SSR renders markup containing:
   - collection nav;
   - selected menu item;
   - selected ranklist title;
   - ranklist content container;
   - row count;
   - renderer table content from the SRK fixture.
10. Browser hydrates the page without replacing the API chain with Playwright mocks.

### SSR Initial Load Without Selected Ranklist

1. Browser requests `/collection/official`.
2. The collection route fetches only the collection.
3. SSR renders the nav and empty state.
4. Browser hydrates and keeps the empty state.

### Invalid `rankId`

1. Browser requests `/collection/official?rankId=missing-key`.
2. The collection route fetches only the collection.
3. `asyncData` marks `ranklistIdInvalid`.
4. SSR renders nav and empty state.
5. Browser hydrates.
6. The page replaces the URL with `/collection/official`.

### CSR Selection

When a user selects a ranklist link:

1. Vue Router navigates to `/collection/:id?rankId=:rankId`.
2. Route-level async data fetches collection and selected ranklist according to the same rules.
3. The page renders `collection-ranklist-content`.
4. If a minimal mobile collapse is implemented, it runs only after the browser selection.

## Error Handling

### Collection Not Found

If `ranklandApiService.getCollection` raises a RankLand NotFound logic exception, the page should render:

```text
data-id="collection-not-found"
Collection Not Found
```

The title should be:

```text
Not Found - RankLand
```

### Collection Generic Error

For other collection load failures, the page should render:

```text
data-id="collection-error"
An error occurred while loading data
```

with a refresh button.

### Selected Ranklist Error

If the selected `rankId` is valid but `getRanklist` fails, the collection nav should still render and the content area should render:

```text
data-id="collection-ranklist-error"
An error occurred while loading data
```

The title should fall back to:

```text
榜单合集 - RankLand
```

### Loading State

If CSR navigation temporarily has no collection data, the page should render:

```text
data-id="collection-loading"
Loading
```

## Head Metadata

Use the existing title formatter:

```ts
formatTitle(title?: string)
```

Title behavior:

- selected ranklist: `${ranklist.info.name} - 榜单合集 - RankLand`;
- no selected ranklist: `榜单合集 - RankLand`;
- collection NotFound: `Not Found - RankLand`;
- generic collection error: `RankLand`.

The page should set:

- `title`;
- `og:title`;
- `og:url`;
- canonical link.

The URL can be built from `ranklandRoutes.collection.build({ id, rankId })`. Relative URLs are acceptable for this foundation because the ranklist foundation already uses relative canonical URLs.

## Testing Strategy

### Unit Tests

Create:

```text
tests/unit/collection-tree.spec.ts
```

Cover:

- `normalizeCollectionId('official') === 'official'`;
- `normalizeCollectionId('由官方整理和维护的') === 'official'`;
- unknown ids pass through unchanged;
- flat ranklist key collection returns `test-key` and `another-key` from the fixture;
- ancestor directory keys for `test-key` include `dir-icpc`;
- invalid ranklist keys are not considered present.

Create:

```text
tests/unit/collection-error.spec.ts
```

Cover:

- RankLand NotFound logic exception maps to collection `not-found`;
- generic collection failures map to `generic`;
- selected ranklist failures map to content-level `ranklist-error`.

### Full-Chain E2E

Create:

```text
tests/e2e/full-chain/collection.spec.ts
```

Cover:

- `/collection/official?rankId=test-key` renders through SSR, hydration, `RanklandApiService`, and the controlled backend;
- SSR HTML contains `Test Contest 2024`;
- page title is `Test Contest 2024 - 榜单合集 - RankLand`;
- `[data-id="collection-ranklist-content"][data-ranklist-id="test-key"][data-row-count="2"]` is visible;
- `Team Alpha` and `Team Beta` render through the Vue SRK wrapper;
- `[data-id="collection-hydrated"]` becomes `hydrated`;
- controlled backend request log contains exactly one `/rank/group/official`, one `/rank/test-key`, and one `/file/download?id=file-test-1`;
- `/collection/official` renders `[data-id="collection-empty-state"]` and does not request `/rank/test-key`;
- `/collection/official?rankId=missing-key` replaces the URL to `/collection/official`, renders empty state, and does not request `/rank/missing-key`.

### Generated Routes

After creating `collection.view.vue`, run router generation so generated route files include `/collection/:id`. Do not hand-edit generated router files.

### Verification Commands

Expected commands for the implementation branch:

```bash
pnpm test:unit
pnpm test:e2e:full-chain
pnpm test:migration
```

`pnpm test:migration` remains the final acceptance command for this slice.

## Acceptance Criteria

- `/collection/:id` exists as an SSR Vue route.
- `/collection/official` SSR-renders collection navigation and empty state.
- `/collection/official?rankId=test-key` SSR-renders the selected ranklist with stable collection test attributes.
- Alias id `由官方整理和维护的` fetches upstream collection `official`.
- Invalid `rankId` does not request ranklist data and replaces the URL to `/collection/:id` after hydration.
- Selected-ranklist load errors do not hide the collection navigation.
- Collection NotFound and generic collection errors have distinct UI states.
- Head metadata matches the foundation title and URL rules.
- Full-chain E2E verifies backend request logs rather than using Playwright route mocks.
- Unit, full-chain E2E, and migration test commands pass before implementation is considered complete.

