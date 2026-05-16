# RankLand Vue API And Routing Design

## Context

This slice continues from `migration/vue-spec-coding` and builds on the foundation harness already in `rankland-web`.

The goal is to migrate the RankLand API service and public route contracts from `rankland-fe` into the Vue/bwcx web project before migrating pages. Page UI migration, SRK renderer integration, and the Node runtime upgrade are deliberately kept out of this slice.

The source API behavior lives in:

- `rankland-fe/src/services/api/index.ts`
- `rankland-fe/src/services/api/interface.ts`
- `rankland-fe/src/services/api/logic.exception.ts`
- `rankland-fe/src/utils/request.ts`
- `rankland-fe/tests/unit/api.service.test.ts`

The target project already has:

- bwcx generated demo `ApiClient` in `src/common/api/api-client.ts`
- client/server axios factories in `src/client/api`
- response parsing in `src/common/api/response-parser.ts`
- migration fixtures in `tests/fixtures`
- unit, SSR, and Playwright harnesses

## Scope

This slice will add RankLand domain API and route infrastructure only.

In scope:

- RankLand API service class.
- RankLand API response and domain interfaces.
- Request adapter abstraction for normal API and CDN API.
- Error mapping for API not-found responses.
- Public route constants and URL builders for migrated RankLand routes.
- Unit tests ported from `rankland-fe`.
- Mock API helper updates needed by future full-chain E2E.

Out of scope:

- Vue page UI migration.
- SRK Vue renderer component integration.
- Production server E2E implementation.
- Node 24 migration.
- Mongo seed or live socket behavior.

## Node Runtime Direction

The current repository still declares Node 16 in `.node-version`, `README.md`, `Dockerfile`, and `package.json`.

Node 16 is already end-of-life. Node 20 is also end-of-life as of 2026. Node 22 is LTS, and Node 24 is Active LTS. The long-term target should be Node 24 LTS, but upgrading the runtime is a separate slice because this repository still depends on older tooling such as Vite 2, `@vitejs/plugin-vue@2`, `vite-ssr@0.16`, `ts-node-dev@1`, and TypeScript 4.6.

This API slice must remain compatible with the current harness. It must not introduce new Node 16-only assumptions, and it must avoid dependencies that block Node 22/24.

## E2E Direction

E2E means end-to-end testing with a real browser.

The foundation branch currently uses:

```text
Playwright -> Vite client server -> route mocks
```

The long-term target is:

```text
Playwright -> bwcx/Koa server -> SSR/CSR -> RankLand API service -> controlled API backend or mocks -> rendered page assertions
```

This API slice prepares for the full-chain direction by keeping API boundaries explicit and mockable. It does not need to start the production server yet. That will be the next slice after API and routing contracts are stable.

## API Architecture

Create a RankLand API module independent from the generated bwcx demo `ApiClient`.

Recommended target files:

- `src/common/rankland-api/interfaces.ts`
- `src/common/rankland-api/exceptions.ts`
- `src/common/rankland-api/request-adapter.ts`
- `src/common/rankland-api/rankland-api.service.ts`
- `src/common/rankland-api/index.ts`

The service constructor should accept two adapters:

```ts
new RanklandApiService({
  api: normalApiAdapter,
  cdnApi: cdnApiAdapter,
  cache: optionalServerCache,
});
```

The service must not import browser-only UI libraries. It must be usable by CSR code, SSR code, and tests.

## Request Adapters

Define a minimal adapter interface instead of binding the service to axios or bwcx generated clients:

```ts
export interface RanklandApiRequestAdapter {
  get<T = unknown>(url: string, opts?: RanklandApiRequestOptions): Promise<T>;
}

export interface RanklandApiRequestOptions {
  getResponse?: boolean;
}
```

`getResponse` is needed for `/file/download`, because the service must read the raw response headers and text to parse SRK JSON.

Adapters can later be backed by:

- axios factories in `src/client/api`
- server-side axios with SSR headers
- test mocks
- full-chain E2E API interceptors

## API Methods

The service must implement these source-compatible methods:

```ts
getRanklistInfo(opts: { uniqueKey: string }): Promise<IApiRanklistInfo>
getSrkFile<T = srk.Ranklist>(opts: { fileID: string }): Promise<T>
getRanklist(opts: { uniqueKey: string }): Promise<IApiRanklist>
searchRanklist(opts: { kw?: string }): Promise<{ ranks: IApiRanklistInfo[] }>
listAllRanklists(): Promise<{ ranks: IApiRanklistInfo[] }>
getCollection(opts: { uniqueKey: string }): Promise<IApiCollection>
getStatistics(): Promise<IApiStatistics>
getLiveRanklistInfo(opts: { uniqueKey: string }): Promise<IApiLiveRanklistInfo>
getLiveRanklist(opts: { id: string; token?: string }): Promise<srk.Ranklist>
```

Endpoint mapping:

| Method | Adapter | Endpoint |
| --- | --- | --- |
| `getRanklistInfo` | CDN API | `GET /rank/:key` |
| `getSrkFile` | CDN API | `GET /file/download?id=:fileID` |
| `getRanklist` | CDN API | composed from `getRanklistInfo` + `getSrkFile` |
| `searchRanklist` | normal API | `GET /rank/search?query=:kw` |
| `listAllRanklists` | normal API | `GET /rank/listall` |
| `getCollection` | CDN API | `GET /rank/group/:key` |
| `getStatistics` | normal API | `GET /statistics` |
| `getLiveRanklistInfo` | normal API | `GET /ranking/config/:uniqueKey?_t=:timestamp` |
| `getLiveRanklist` | normal API | `GET /ranking/:id?_t=:timestamp&token=:token` |

## Response Handling

The service assumes adapters return already unwrapped data for normal JSON endpoints.

For raw SRK downloads:

- The adapter returns `{ response }` when `getResponse: true`.
- `content-type` must be normalized by splitting at `;`.
- `application/json` should be parsed from `response.text()`.
- Other content types should throw `Error('Unknown srk content type')`.

This mirrors `rankland-fe` and keeps SRK download behavior explicit.

## Cache Behavior

Source `rankland-fe` uses a global SSR cache manager for ranklist info, SRK file, and collection content.

In the Vue project, cache support should be injected and optional:

```ts
export interface RanklandApiCache {
  get(key: string): Promise<unknown>;
  setEx(key: string, ttlSeconds: number, value: string): Promise<void>;
  del(key: string): Promise<void>;
}
```

No global cache lookup should be hidden inside the service. SSR integration can pass a cache implementation later. If no cache is provided, all methods should still work.

Cache keys and TTLs should match the source behavior:

| Method | Cache key | TTL |
| --- | --- | --- |
| `getRanklistInfo` | `rankland_ssr_api_cache:getRanklistInfo:${uniqueKey}` | 60 seconds |
| `getSrkFile` | `rankland_ssr_api_cache:getSrkFile:${fileID}` | 24 hours |
| `getCollection` | `rankland_ssr_api_cache:getCollection:${uniqueKey}` | 2 minutes |

If cached SRK JSON cannot be parsed, the service should delete that key and refetch.

## Error Mapping

Add RankLand domain exceptions:

```ts
export enum RanklandLogicExceptionKind {
  NotFound = 'NotFound',
}

export class RanklandLogicException extends Error {
  public readonly kind: RanklandLogicExceptionKind;
}
```

`getRanklist` must translate these failures to `RanklandLogicExceptionKind.NotFound`:

- API exception with `code === 11`
- HTTP exception with `status === 404`

Other errors must be rethrown unchanged.

The adapter exception types should be small and local:

```ts
export class RanklandApiException extends Error {
  public readonly code: number;
}

export class RanklandHttpException extends Error {
  public readonly status: number;
}
```

## Route Architecture

Add route constants and URL builders without changing the generated bwcx demo routes yet.

Recommended target file:

- `src/common/rankland-router/routes.ts`

Public route definitions:

| Name | Path | SSR target |
| --- | --- | --- |
| `home` | `/` | yes |
| `search` | `/search` | yes |
| `ranklist` | `/ranklist/:id` | yes |
| `collection` | `/collection/:id` | yes |
| `live` | `/live/:id` | CSR-first initially |
| `playground` | `/playground` | CSR |

URL builders should encode route parameters and query values:

```ts
ranklandRoutes.ranklist.build({ id: 'abc', focus: 'yes' }) === '/ranklist/abc?focus=yes'
ranklandRoutes.search.build({ kw: 'hello world' }) === '/search?kw=hello%20world'
ranklandRoutes.collection.build({ id: 'official', rankId: 'test-key' }) === '/collection/official?rankId=test-key'
ranklandRoutes.live.build({ id: 'live', token: 'private', scrollSolution: '1', focus: 'yes' }) === '/live/live?token=private&scrollSolution=1&focus=yes'
```

This slice should not wire these routes into the visible Vue app. The route constants become the contract that page migration consumes in later slices.

## Testing Requirements

Unit tests must cover:

- All API endpoint URL mappings.
- `getSrkFile` JSON parsing and unknown content type error.
- `getRanklist` composition.
- `getRanklist` not-found error mapping.
- `getCollection` parsing of stringified collection content.
- cache hit/set/delete behavior for cached methods.
- live ranklist cache-busting `_t` query.
- route URL builders and query encoding.

Tests should use existing fixtures under `tests/fixtures`.

The minimum verification gate for this slice:

```bash
fnm exec --using=16.20.2 pnpm run build
fnm exec --using=16.20.2 pnpm test:unit
fnm exec --using=16.20.2 pnpm test:migration
```

If a Node upgrade spike is run in parallel, it must be recorded separately and must not be required for this API slice to pass.

## Full-Chain E2E Follow-Up

After this slice, create a separate full-chain E2E slice.

That slice should:

- start the bwcx/Koa server in a test mode that does not require external Mongo for public read-only pages, or provide controlled Mongo setup/seed;
- route RankLand API calls through the new `RanklandApiService`;
- intercept external normal/CDN API domains or point them at a local mock server;
- assert SSR HTML and browser-rendered content for at least `/` and one ranklist detail route.

## Acceptance Criteria

- API service and route contracts exist in common code and are usable from SSR and CSR.
- API service unit tests are ported from `rankland-fe` and pass.
- Route builder tests pass.
- Existing foundation tests still pass.
- No dependency is added that blocks the future Node 24 target.
- No visible page migration is bundled into this slice.
