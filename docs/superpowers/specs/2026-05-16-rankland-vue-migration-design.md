# RankLand Vue Migration Design

## Purpose

Migrate the RankLand frontend from `rankland-fe` to `rankland-web`, replacing the Umi/React frontend with a Vue 3 SSR-compatible implementation on top of the existing bwcx + vite-ssr application.

The migration must preserve the public user experience, SEO behavior, route compatibility, SRK rendering features, and live ranklist behavior while establishing a long-term spec coding workflow and harness engineering practice inside `rankland-web`.

## Source And Target

Source project:

- Repository: `https://github.com/algoux/rankland-fe`
- Local path: `/Users/cooper/Projects/RankLand/rankland-fe`
- Stack: Umi 3, React 17, Ant Design React, Koa SSR, `umi-request`
- Core routes: `/`, `/search`, `/ranklist/:id`, `/collection/:id`, `/playground`, `/live/:id`

Target project:

- Repository: `https://github.com/algoux/rankland-web`
- Local path: `/Users/cooper/Projects/RankLand/rankland-web`
- Stack: bwcx, Vue 3, vite-ssr, vue-router 4, TypeScript, Koa via bwcx-ljsm
- Existing SSR flow: bwcx `@UseClientRoutes()` routes front-end views to `ViewService`, which calls `IPageRenderer` in SSR or CSR mode

Vue SRK renderer:

- Package: `@algoux/standard-ranklist-renderer-component-vue`
- Target version: `0.5.1`
- Peer requirement: `vue >=3.4.0`
- Usage: import shared styles once and pass static ranklist data converted by `convertToStaticRanklist` from `@algoux/standard-ranklist-renderer-component-core`

## Migration Principles

1. Preserve route compatibility. Existing public URLs must continue to work.
2. Preserve SSR for SEO-sensitive pages: home, ranklist detail, and collection pages.
3. Prefer CSR for browser-only workflows: playground and live ranklist interaction.
4. Avoid embedding React in the Vue app. Shared behavior should be ported to Vue composables, Vue components, and framework-neutral utilities.
5. Keep generated bwcx router files generated. Route source of truth should be `.view.vue` files and RPO classes.
6. Treat migrated tests and fixtures as the migration harness. Every migrated page should bring over enough tests to prevent regression.
7. Decompose large behavior, especially SRK rendering and collection navigation, into independently testable units.

## Accepted Technology Decisions

### UI Library

Use `ant-design-vue` for the migration.

Reasoning:

- The source project is already built around Ant Design components and layout assumptions.
- `ant-design-vue` minimizes UI behavior rewrites for menu, modal, dropdown, switch, input, list, card, spin, and notification use cases.
- It reduces the risk of changing product behavior during the framework migration.

### SRK Renderer

Use `@algoux/standard-ranklist-renderer-component-vue` instead of the old React renderer.

Required follow-up:

- Upgrade Vue in `rankland-web` from `3.2.31` to `>=3.4.0`.
- Validate compatibility with the existing `vite@~2.7.13`, `vite-ssr@0.16.0`, `vue-class-component`, and `vue-property-decorator` setup.
- If Vue 3.4 breaks the class-component stack, migrate new pages to Composition API while preserving bwcx route metadata via `routeView()` or a thin class wrapper.

### Spec Coding Workflow

Use spec coding as the long-term development flow:

1. Write a design spec for each migration slice.
2. Review and approve the spec before implementation.
3. Write an implementation plan with task-sized steps.
4. Implement through isolated tasks.
5. Verify with unit tests, SSR smoke tests, and E2E tests.
6. Commit each coherent task with the tests that protect it.

## Route Mapping

| Source route | Target module | Render method | Notes |
| --- | --- | --- | --- |
| `/` | `src/client/modules/home/home.view.vue` | SSR | Preserve statistics, SEO title, canonical URL, JSON-LD, intro content, resource links |
| `/search` | `src/client/modules/search/search.view.vue` | CSR | Preserve `kw` query, Fuse search, recent list, result data attributes |
| `/ranklist/:id` | `src/client/modules/ranklist/ranklist.view.vue` | SSR | Preserve data loading, NotFound handling, SRK renderer, canonical URL |
| `/collection/:id` | `src/client/modules/collection/collection.view.vue` | SSR | Preserve `rankId` query, collection tree, selected ranklist, mobile nav behavior |
| `/playground` | `src/client/modules/playground/playground.view.vue` | CSR | Monaco must stay client-only; SSR renders loading shell |
| `/live/:id` | `src/client/modules/live/live.view.vue` | CSR | Polling, WebSocket scroll-solution feed, token query, `scrollSolution=1` query |

Route props should be declared in `src/common/modules/<feature>/*.rpo.ts` using bwcx route decorators:

- `RanklistRPO`: `id` in param, optional `focus` in query
- `CollectionRPO`: `id` in param, optional `rankId` in query
- `SearchRPO`: optional `kw` in query
- `LiveRPO`: `id` in param, optional `token`, `scrollSolution`, `focus` in query

## bwcx SSR And Routing Model

The target app should keep the existing bwcx rendering model:

- `scripts/client-routes.gen.js` scans `src/client/modules/**/*.view.vue`.
- Generated routes go to `src/client/router/routes.ts`.
- Generated route metadata goes to `src/common/router/client-routes.ts`.
- `src/server/index.ts` binds `BwcxClientVueClientRoutesMapId` to `clientRoutesMap`.
- `ViewController` uses `@UseClientRoutes()` to expose all generated client routes.
- `ViewService` chooses CSR or SSR based on route render method and `?ssr=0`.
- `PageRendererDev` and `PageRendererProd` handle vite-ssr rendering.

New pages should use `@RenderMethod(RenderMethodKind.SSR)` only when server-side data is deterministic and browser-only APIs are guarded.

## Data Layer Design

Create a RankLand data service in `rankland-web` instead of directly copying the old `umi-request` setup.

Responsibilities:

- Preserve `ApiService` methods from `rankland-fe`:
  - `getRanklistInfo`
  - `getSrkFile`
  - `getRanklist`
  - `searchRanklist`
  - `listAllRanklists`
  - `getCollection`
  - `getStatistics`
  - `getLiveRanklistInfo`
  - `getLiveRanklist`
- Preserve exception semantics:
  - API response code `11` maps to RankLand NotFound logic exception.
  - HTTP `404` maps to RankLand NotFound logic exception.
  - Other API and HTTP errors remain visible to SSR and client error states.
- Support SSR request context:
  - Forward cookie, user-agent, server render IP, and forwarded IP where applicable.
  - Use server-side API base URLs during SSR.
  - Use client-side API base URLs in the browser.
- Support CDN API and normal API separately.
- Support response parsing for both wrapped `{ code, message, data }` responses and raw SRK file downloads.

Configuration should be explicit:

- `RANKLAND_API_BASE_SERVER`
- `RANKLAND_API_BASE_CLIENT`
- `RANKLAND_CDN_API_BASE_SERVER`
- `RANKLAND_CDN_API_BASE_CLIENT`
- `RANKLAND_SITE_ALIAS`
- `RANKLAND_SITE_ORIGIN`
- `RANKLAND_LIVE_POLLING_INTERVAL`
- `RANKLAND_WS_BASE`

The migration may temporarily support the old environment variable names, but the target app should document the canonical names.

## Cache Design

The source app has two cache categories:

- SSR HTML cache: short-lived full-page cache by URL.
- SSR API cache: ranklist info, SRK file, and collection cache.

The target app should introduce a small cache abstraction:

- `CacheService.get(key)`
- `CacheService.setEx(key, ttlSeconds, value)`
- `CacheService.del(key)`

Runtime behavior:

- Production can use Redis when configured.
- Development and tests can use an in-memory TTL map.
- API cache keys should remain stable and namespaced as `rankland:ssr-api:<method>:<key>`.
- Full-page SSR HTML cache should be added only after page-level SSR tests pass. The first migration pass can rely on API caching to reduce complexity.

## Component Migration

### Layout

Port `src/layouts/index.tsx` into Vue:

- Header with logo.
- Top navigation.
- Right menu.
- Focus mode via `focus=yes` or `聚焦=是`.
- Theme detection via `prefers-color-scheme`.
- Body class adjustment for macOS Blink effect optimization.
- Google Analytics pageview behavior, guarded for browser only.
- Back-to-top behavior through `ant-design-vue`.

### Shared Utilities

Port as framework-neutral TypeScript utilities first:

- `title-format.util.ts`
- `time-format.util.ts`
- `srk-asset.util.ts`
- `mini-cache.util.ts`
- `ranklist.util.ts`
- `rank-time-data.util.ts`
- `realtime-solutions.util.ts`
- route formatter equivalent for generated route names

Utilities should receive unit tests before they are used by migrated pages.

### Shared Composables

Port React hooks into Vue composables:

- `useClientWidthHeight`
- `useRemainingHeight`
- `useCurrentUrl`
- local storage state helper for collection nav and playground welcome state

Browser APIs must be guarded so SSR does not read `window`, `document`, `localStorage`, `navigator`, `WebSocket`, or `matchMedia`.

### SRK Renderer Wrapper

Create a Vue wrapper equivalent to `StyledRanklist` and `StyledRanklistRenderer`.

Responsibilities:

- Validate SRK data when checker generation is available.
- Convert SRK ranklist to static ranklist.
- Render `Ranklist`, `ProgressBar`, `DefaultUserModal`, and `DefaultSolutionModal`.
- Implement filters:
  - organization filter
  - official-only filter
  - marker filter
- Implement time travel:
  - filter solutions until selected time
  - regenerate ranklist
  - recalculate problem statistics
- Implement export actions:
  - SRK JSON
  - Codeforces Gym Ghost DAT
  - VJudge Replay
  - General Excel
- Implement share/copy actions.
- Implement user detail modal and solution modal.
- Preserve data attributes used by E2E tests.

This wrapper should be migrated as its own spec and plan because it is the most complex user-facing component.

## Page Migration Details

### Home

SSR data:

- `getStatistics()`

Behavior to preserve:

- Title: `RankLand`
- `og:title`, `og:url`, canonical link
- WebSite JSON-LD with search action
- SiteNavigationElement JSON-LD
- Recommended cards
- Resource links
- Contact section
- Footer-like about section
- ICP link when site alias is `cnn`

### Search

CSR data:

- `listAllRanklists()`

Behavior to preserve:

- `kw` query controls initial search.
- Empty query shows recent ranklists.
- Keyword query uses Fuse with `name` and `uniqueKey`.
- Result count appears in `[data-id="search-result-section"]`.
- Links point to `/ranklist/:id`.

### Ranklist Detail

SSR data:

- `getRanklist({ uniqueKey: id })`

Behavior to preserve:

- NotFound state for missing ranklist.
- Generic error state for other errors.
- Loading state for CSR transitions.
- SEO title, `og:title`, `og:url`, canonical link.
- `data-id="ranklist-content"`, `data-ranklist-id`, and `data-row-count`.
- SRK renderer with footer, filter, and table layout.

### Collection

SSR data:

- `getCollection({ uniqueKey: realId })`
- Optional `getRanklist({ uniqueKey: rankId })`

Behavior to preserve:

- Alias translation: `official` and `由官方整理和维护的` map to `official`.
- Invalid `rankId` redirects or replaces URL to `/collection/:id`.
- Missing rankId shows empty state.
- Valid rankId opens ancestor directories and renders selected ranklist.
- Mobile layout collapses navigation after selection.
- Collapse state persists in local storage.
- SEO title depends on selected ranklist when available.

### Playground

CSR behavior:

- Monaco editor is loaded only on the client.
- Default demo SRK JSON loads from local asset.
- JSON schema validation uses `@algoux/standard-ranklist/schema.json`.
- Preview renders only when JSON is valid and client editor is ready.
- Welcome modal uses local storage to avoid repeat display.

### Live

CSR behavior:

- Load public live contest info.
- Poll live ranklist on `RANKLAND_LIVE_POLLING_INTERVAL`.
- Reset ranklist when route id changes.
- Preserve `token` query for private/live access.
- Preserve `scrollSolution=1` query.
- WebSocket connects to `RANKLAND_WS_BASE/ranking/record/:id`.
- WebSocket binary payload is parsed by migrated realtime solution parser.
- Scroll solution panel receives mapped SRK-like solution events.

## Harness Engineering

Harness assets should live in `rankland-web` and be maintained long-term.

### Documentation Harness

Create and maintain:

- `docs/migration/inventory.md`: source pages, components, utilities, assets, APIs, and tests.
- `docs/migration/route-compatibility.md`: route names, paths, params, query behavior, render method, status.
- `docs/migration/api-contract.md`: upstream API methods, URL paths, response shapes, error mapping.
- `docs/superpowers/specs/*.md`: one design spec per migration slice.
- `docs/superpowers/plans/*.md`: implementation plans generated from approved specs.

### Test Harness

Port these from `rankland-fe`:

- `tests/fixtures/ranklist.srk.json`
- `tests/fixtures/collection.json`
- `tests/fixtures/live-info.json`
- `tests/fixtures/listall.json`
- `tests/fixtures/statistics.json`
- `tests/fixtures/ranklist-info.json`

Add:

- Unit tests for utilities and API response parsing.
- SSR smoke tests for built pages.
- Playwright tests for migrated user flows.
- Mock API helper that can intercept:
  - `/rank/listall`
  - `/rank/search`
  - `/statistics`
  - `/rank/group/:key`
  - `/file/download`
  - `/ranking/config/:uniqueKey`
  - `/ranking/:id`
  - `/rank/:key`

Target scripts:

- `pnpm test:unit`
- `pnpm test:ssr`
- `pnpm test:e2e`
- `pnpm test:migration`

### Route Compatibility Harness

Add a script that compares the expected route set with generated bwcx routes:

- `/`
- `/search`
- `/ranklist/:id`
- `/collection/:id`
- `/playground`
- `/live/:id`

The script should fail if any route is missing, renamed incorrectly, or assigned an unexpected render method.

## Implementation Slices

### Slice 1: Framework And Dependency Compatibility

Goal:

- Upgrade Vue to satisfy the SRK renderer.
- Install `ant-design-vue`.
- Install `@algoux/standard-ranklist-renderer-component-vue`.
- Verify dev server, route generation, SSR build, and a demo route still work.

Acceptance:

- `pnpm install` completes.
- `pnpm run gen:client-router` completes.
- `pnpm run build` completes or any incompatibility is documented with a follow-up fix.
- Existing demo/home route still SSR-renders.

### Slice 2: Harness Foundation

Goal:

- Bring over fixtures, unit test runner, Playwright config, SSR smoke test pattern, and mock API helper.

Acceptance:

- `pnpm test:unit` runs at least route/API utility tests.
- `pnpm test:ssr` can skip cleanly when no build exists and pass after build.
- `pnpm test:e2e` can run against local dev server with mocked APIs.

### Slice 3: Routing And Config

Goal:

- Add route RPOs, route formatter, URL origin helper, and render method declarations for the six public routes.

Acceptance:

- Generated route files include all target routes.
- Route compatibility script passes.
- Route formatter tests pass.

### Slice 4: Data Layer

Goal:

- Port API service behavior into target app.
- Add exception mapping and cache abstraction.

Acceptance:

- Unit tests cover wrapped API success, API error, HTTP 404, SRK file download, collection parse, and cache hit behavior.
- SSR data fetch receives cookie and user-agent headers in server mode.

### Slice 5: Layout And Shared Components

Goal:

- Port app shell, navigation, theme, loading, contact, beian, copy button, asset image, and browser-safe composables.

Acceptance:

- Focus mode removes shell.
- Theme class updates on browser preference.
- Browser-only logic does not execute during SSR.

### Slice 6: Home And Search

Goal:

- Migrate low-risk public pages first.

Acceptance:

- Home SSR smoke passes.
- Search E2E recent list and keyword search pass.
- SEO title and canonical assertions pass for home.

### Slice 7: SRK Renderer Wrapper

Goal:

- Build the Vue SRK wrapper with renderer component, filters, progress, modal interactions, export actions, and rank-time data.

Acceptance:

- Unit tests cover data transformation utilities.
- Component-level or E2E tests verify a fixture ranklist renders two rows.
- No hydration error appears for SSR ranklist page.

### Slice 8: Ranklist Detail

Goal:

- Migrate `/ranklist/:id`.

Acceptance:

- SSR smoke passes for `/ranklist/test-key`.
- E2E visible selector passes for ranklist content.
- NotFound E2E passes for missing key.

### Slice 9: Collection

Goal:

- Migrate `/collection/:id`.

Acceptance:

- SSR smoke passes with and without `rankId`.
- E2E verifies menu, selected ranklist, empty state, and row count.
- Invalid rankId behavior is covered.

### Slice 10: Playground

Goal:

- Migrate `/playground` as client-only Monaco workflow.

Acceptance:

- SSR smoke returns loading shell without crashing.
- E2E verifies editor loads, valid fixture renders preview, invalid JSON shows prompt.

### Slice 11: Live Ranklist

Goal:

- Migrate `/live/:id`.

Acceptance:

- E2E verifies mocked live ranklist row count.
- WebSocket is stubbed in tests.
- Polling cleanup works on route change/unmount.

### Slice 12: Deployment And Cutover

Goal:

- Align Docker, PM2, environment variables, static assets, SSR fallback, and production startup.

Acceptance:

- Production build starts with `pnpm start`.
- `/dist` assets are served correctly.
- SSR fallback returns CSR shell on render error.
- Deployment docs list required environment variables.

## Verification Gates

No migration slice is complete until its gate passes.

Per-slice gates:

- Relevant unit tests pass.
- Relevant generated files are updated.
- Relevant E2E tests pass or are explicitly deferred in the slice spec.
- SSR smoke passes for SSR routes touched by the slice.
- Browser console has no hydration errors for touched pages.

Full migration gate:

- `pnpm run build`
- `pnpm test:unit`
- `pnpm test:ssr`
- `pnpm test:e2e`
- Route compatibility script
- Manual smoke of production server:
  - `/`
  - `/search?kw=Test`
  - `/ranklist/test-key`
  - `/collection/official?rankId=test-key`
  - `/playground`
  - `/live/live-test-key`

## Known Risks And Mitigations

### Vue Version Compatibility

Risk:

- The Vue SRK renderer requires Vue `>=3.4.0`, while `rankland-web` currently uses Vue `3.2.31`.

Mitigation:

- Perform dependency compatibility as the first slice.
- Keep the first slice limited to framework upgrade and demo route verification.
- If class-component compatibility blocks Vue 3.4, migrate new pages to Composition API and keep bwcx route metadata through supported route declaration patterns.

### SSR Hydration Drift

Risk:

- Browser-only data such as client width, random values, local storage, WebSocket, and Monaco can cause SSR crashes or hydration mismatch.

Mitigation:

- Use client-only wrappers for Monaco and WebSocket.
- Initialize browser-only values after `mounted`.
- Keep SSR-rendered markup deterministic for SSR pages.

### SRK Renderer Complexity

Risk:

- The old `StyledRanklistRenderer` mixes rendering, filtering, export, modals, rank-time calculation, and SEO/footer concerns.

Mitigation:

- Split SRK renderer migration into a dedicated slice.
- Port framework-neutral rank-time and SRK utilities before component work.
- Keep E2E data attributes stable.

### API And Cache Differences

Risk:

- The old app uses global Redis cache and `umi-request`; the target app currently uses axios and generated bwcx API client patterns.

Mitigation:

- Implement a small RankLand upstream API service instead of forcing upstream APIs into bwcx generated controller contracts.
- Add response parser tests and cache tests.
- Keep cache optional in development and tests.

### Visual Drift

Risk:

- React AntD and `ant-design-vue` have similar components but not identical DOM and styling.

Mitigation:

- Preserve user-facing behavior and stable `data-id` selectors rather than exact old DOM.
- Use Playwright visual or screenshot checks for high-risk pages after functional parity.

## Initial Backlog

1. Add migration inventory document.
2. Add route compatibility document and script.
3. Upgrade Vue and install accepted dependencies.
4. Add testing harness and fixtures.
5. Add RankLand API service tests.
6. Add route RPOs and route formatter.
7. Migrate home page.
8. Migrate search page.
9. Create SRK renderer wrapper spec.
10. Migrate ranklist detail.
11. Create collection page spec.
12. Migrate collection page.
13. Create playground spec.
14. Migrate playground.
15. Create live page spec.
16. Migrate live page.
17. Complete deployment/cutover checklist.

## Open Decisions

All decisions required for the initial migration plan are resolved:

- UI library: `ant-design-vue`
- SRK renderer: `@algoux/standard-ranklist-renderer-component-vue`
- SSR framework: existing bwcx + vite-ssr stack
- Workflow: spec coding with harness engineering in `rankland-web`

Any later change to these decisions should update this spec before implementation continues.
