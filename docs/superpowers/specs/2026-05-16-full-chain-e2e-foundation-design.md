# RankLand Full-Chain E2E Foundation Design

## Context

This slice starts from `migration/vue-api-routing` and runs on local branch `migration/full-chain-e2e-foundation`.

The previous migration slices established:

- Vue 3 / vite-ssr / bwcx migration harness.
- Unit, SSR smoke, and Playwright gates.
- RankLand domain API service and public route URL contracts in common code.

The current Playwright harness is intentionally shallow:

```text
Playwright -> Vite client server -> page.route API mocks -> rendered demo page
```

The migration target needs a deeper full-chain foundation:

```text
Playwright -> bwcx/Koa server -> SSR/CSR -> RankLandApiService -> controlled API backend/mock -> rendered assertions
```

Real RankLand Vue pages have not been migrated yet. This slice must therefore validate the chain without bundling page migration, SRK renderer migration, live socket behavior, or the Node runtime upgrade.

## Scope

In scope:

- A test-only RankLand probe route that exercises SSR and CSR through the real bwcx/Koa server.
- Server-side and client-side RankLand API adapters backed by the existing `RanklandApiService`.
- Explicit RankLand API base URL configuration for SSR, CSR, and tests.
- A controlled local mock backend for upstream RankLand normal API and CDN API endpoints.
- Playwright configuration that starts the bwcx/Koa server for full-chain E2E tests.
- E2E assertions proving SSR HTML, hydrated CSR behavior, and upstream mock calls.
- Test-mode server switches that avoid external Mongo/socket requirements for this read-only E2E path.
- Documentation and scripts that keep the existing unit, SSR, and migration gates clear.

Out of scope:

- Migrating visible RankLand pages such as `/ranklist/:id`, `/search`, `/collection/:id`, `/live/:id`, or `/playground`.
- SRK renderer UI parity.
- Full-page SSR HTML caching.
- Production Redis or Mongo changes.
- Live contest WebSocket E2E.
- Node 24 LTS upgrade. That remains a separate branch.
- Merging or pushing this branch.

## Design Choice

Use a hidden, test-only probe route rather than a real user-facing RankLand page.

The route should be available only when an explicit E2E flag is set:

```text
RANKLAND_E2E_PROBE=1
```

The recommended path is:

```text
/__e2e/rankland-probe/:id
```

This route is not a product feature. It exists to prove that the migration stack can carry data from controlled upstream APIs through the bwcx/Koa server, vite-ssr, Vue async data, hydration, and browser assertions. Keeping it hidden avoids coupling this foundation slice to page migration decisions.

## Architecture

### Probe Page

Add a focused Vue view under `src/client/modules/e2e/`.

The page should:

- register with `routeView` using `RenderMethodKind.SSR`;
- accept `id` as a route prop;
- call `RanklandApiService.getRanklist({ uniqueKey: id })` from `asyncData`;
- call `RanklandApiService.getStatistics()` from `asyncData`;
- render stable `data-testid` attributes for ranklist name, unique key, SRK row count, total SRK count, render source, and a CSR hydration marker;
- include a small mounted-state marker so Playwright can distinguish initial SSR HTML from hydrated browser state;
- include a refresh button that calls `RanklandApiService.getStatistics()` in the browser and updates a client-only counter.

The page should not import or render the production SRK renderer. The foundation assertion only needs to prove that RankLand API data reached Vue through the full chain. A simple row count and title are enough.

### Route Registration

Route registration should be explicit and test-gated.

`src/client/routes.ts` can append the probe route only when `process.env.RANKLAND_E2E_PROBE === '1'`. Production and normal development builds should not expose the path.

The route entry should live in a small module, for example:

```text
src/client/router/e2e-routes.ts
```

The generated bwcx client routes map is currently checked in at `src/common/router/client-routes.ts`. The full-chain E2E route must also be known to the bwcx server-side view router when the E2E flag is enabled. To keep generated-route churn out of this foundation, add a small helper that returns the base `clientRoutesMap` plus the probe contract when enabled. `OurApp` should bind that helper result instead of the raw map.

### RankLand API Service Wiring

The existing `RanklandApiService` is adapter-driven and usable from SSR, CSR, and tests. This slice should add concrete axios adapters without changing the service contract.

Recommended target modules:

```text
src/client/rankland-api/adapters.ts
src/client/rankland-api/factory.ts
src/client/plugins/rankland-api.plugin.ts
```

The factory should create one service instance from explicit base URLs:

- SSR normal API: `RANKLAND_API_BASE_SERVER`
- SSR CDN API: `RANKLAND_CDN_API_BASE_SERVER`
- CSR normal API: `RANKLAND_API_BASE_CLIENT`
- CSR CDN API: `RANKLAND_CDN_API_BASE_CLIENT`

For E2E, SSR base URLs should point to the local mock backend. CSR base URLs should point to the same mock backend using browser-reachable localhost URLs. This deliberately tests both server-originated and browser-originated RankLand API traffic.

The Vue app should provide the service through an injection token, for example:

```ts
export const RANKLAND_API_SERVICE_TOKEN = Symbol('RanklandApiService');
```

Probe code should consume this injected service from `asyncData` rather than constructing adapters inside the view.

### Controlled Mock Backend

Add a small Node/Koa mock backend under `tests/e2e/support/`.

It should serve the existing fixtures:

| Endpoint | Response |
| --- | --- |
| `GET /rank/:key` | wrapped `{ code: 0, message: 'success', data: ranklistInfo }` |
| `GET /file/download?id=:fileID` | raw SRK JSON with `application/json` content type |
| `GET /statistics` | wrapped `{ code: 0, message: 'success', data: statistics }` |
| `GET /rank/listall` | wrapped `{ code: 0, message: 'success', data: listall }` |
| `GET /rank/search?query=:kw` | wrapped `{ code: 0, message: 'success', data: listall }` |
| `GET /rank/group/:key` | wrapped `{ code: 0, message: 'success', data: { content } }` |
| `GET /ranking/config/:uniqueKey` | wrapped `{ code: 0, message: 'success', data: liveInfo }` |
| `GET /ranking/:id` | wrapped `{ code: 0, message: 'success', data: srk }` |

The concrete axios adapter is responsible for unwrapping normal JSON responses before returning data to `RanklandApiService`. Raw SRK downloads keep the raw response path because `getSrkFile()` checks response headers and parses `response.text()`.

The mock backend should also expose a small request log endpoint, such as:

```text
GET /__requests
```

Playwright can use this to assert that the application server and browser actually contacted the controlled backend. External network calls should remain blocked in the browser.

### bwcx/Koa Test Server

Playwright should start the real application server, not Vite, for the full-chain suite.

The E2E server command should set:

```text
NODE_ENV=development
RANKLAND_E2E_PROBE=1
RANKLAND_E2E_SKIP_MONGO=1
RANKLAND_E2E_SKIP_SOCKET=1
SERVER_HOST=127.0.0.1
SERVER_PORT=<test app port>
RANKLAND_API_BASE_SERVER=http://127.0.0.1:<mock port>
RANKLAND_CDN_API_BASE_SERVER=http://127.0.0.1:<mock port>
RANKLAND_API_BASE_CLIENT=http://127.0.0.1:<mock port>
RANKLAND_CDN_API_BASE_CLIENT=http://127.0.0.1:<mock port>
```

The existing server currently initializes Mongo in `afterWire()` and initializes Socket.IO during bootstrap. This slice should add explicit test-mode guards:

- skip Mongo initialization only when `RANKLAND_E2E_SKIP_MONGO === '1'`;
- skip Socket.IO initialization only when `RANKLAND_E2E_SKIP_SOCKET === '1'`.

Default development and production behavior must remain unchanged.

### Playwright Layout

Keep the existing shallow Vite smoke test available if useful, but add a separate full-chain config or script so the intent is obvious.

Recommended scripts:

```json
{
  "test:e2e": "playwright test",
  "test:e2e:full-chain": "playwright test -c playwright.full-chain.config.ts"
}
```

`test:migration` should include the full-chain test only after it is reliable in local gate conditions. The target gate for this branch should be:

```text
pnpm run build
pnpm test:unit
pnpm test:ssr
pnpm test:e2e
pnpm test:e2e:full-chain
```

If runtime constraints require preserving the old `test:migration` script unchanged temporarily, the new full-chain script must still be documented and run as the branch gate before completion.

## Data Flow

SSR request:

```text
Playwright page.goto('/__e2e/rankland-probe/test-key')
  -> bwcx/Koa ViewController
  -> PageRendererDev.render('ssr')
  -> vite-ssr entry-server
  -> mainEntry router.beforeResolve
  -> probe asyncData
  -> injected RanklandApiService
  -> axios adapter
  -> local mock backend
  -> fixture data
  -> SSR HTML contains ranklist assertions
```

CSR hydration and interaction:

```text
Browser hydrates SSR page
  -> mounted marker becomes visible
  -> Playwright clicks the refresh button
  -> browser calls RanklandApiService.getStatistics() again
  -> browser reaches local mock backend
  -> Playwright confirms the client-only counter update and mock request log
```

## Error Handling

The foundation test should cover the happy path only. Error-state behavior belongs with real page migration.

The adapters should still preserve domain error semantics:

- wrapped RankLand response errors should throw `RanklandApiException`;
- HTTP non-2xx responses should throw `RanklandHttpException`;
- SRK raw download must preserve `getResponse` behavior and content-type checks.

The probe page can render a compact error marker for unexpected failures so Playwright failures are easy to inspect, but the test should expect the success path.

## Test Requirements

Unit tests:

- verify axios adapter URL joining and response unwrapping;
- verify HTTP error mapping;
- verify full-chain route map helper includes the probe only when `RANKLAND_E2E_PROBE=1`;
- verify RankLand API factory chooses server/client base URLs from the right environment variables.

Playwright full-chain tests:

- start the mock backend and bwcx/Koa app server;
- navigate to `/__e2e/rankland-probe/test-key`;
- assert SSR HTML already contains fixture ranklist name before hydration-only markers are required;
- assert hydration marker appears;
- assert ranklist unique key, SRK row count, and statistics render from fixture data;
- click the refresh button and assert the client-only statistics counter changes;
- assert the mock backend saw `/rank/test-key`, `/file/download`, and at least two `/statistics` requests;
- block unexpected external browser calls.

Existing gates:

- `pnpm run build`
- `pnpm test:unit`
- `pnpm test:ssr`
- `pnpm test:e2e`
- `pnpm test:e2e:full-chain`

## Acceptance Criteria

- The branch contains a local-only full-chain E2E foundation and no real RankLand page migration.
- Playwright full-chain tests run against the real bwcx/Koa server, not Vite.
- RankLand data is fetched through `RanklandApiService`, not by Playwright `page.route()` mocks.
- Upstream APIs are controlled by a local mock backend using existing fixtures.
- Mongo and Socket.IO are skipped only by explicit E2E env flags.
- Existing shallow E2E, unit, SSR, and build gates still pass.
- No Node runtime upgrade or dependency modernization is bundled into this branch.
- No merge or push is performed.
