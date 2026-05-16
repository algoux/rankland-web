# Ranklist Page Foundation Design

## Context

This slice starts from local branch `migration/node-24-lts` and runs on local branch `migration/ranklist-page-foundation`.

The Node 24 LTS upgrade is already complete and verified with:

```bash
fnm exec --using v24.11.1 corepack pnpm test:migration
```

The current migration stack already has:

- `RanklandApiService` with server/client adapters;
- Vue injection through `RanklandApiPlugin`;
- a hidden full-chain probe route;
- a full-chain Playwright harness that starts the real bwcx/Koa app server and a controlled local RankLand API backend;
- request logging in the controlled backend for E2E chain assertions.

This branch migrates the first real user-visible RankLand route:

```text
/ranklist/:id
```

The test chain must remain:

```text
Playwright -> bwcx/Koa -> SSR/CSR -> RankLandApiService -> controlled API backend/mock
```

Full-chain Playwright tests must not use `page.route` to mock app API responses.

## Goal

Add a foundation version of the ranklist detail page that proves a real visible route can load RankLand data through SSR, hydrate in the browser, render SRK content, and be verified through the existing full-chain E2E harness.

## Non-Goals

This branch does not attempt full old React page parity. These remain later migration slices:

- search page integration;
- collection integration;
- live ranklist behavior;
- playground behavior;
- full `StyledRanklistRenderer` feature parity, including download/export actions;
- organization/marker/official filters;
- time-travel progress controls;
- user and solution modal parity;
- rank-time charts;
- visual polish of the global app shell.

## Existing Source Behavior

The old React page at `rankland-fe/src/pages/ranklist/[id].tsx`:

- SSR-loads `api.getRanklist({ uniqueKey: id })`;
- shows NotFound for `LogicExceptionKind.NotFound`;
- shows a generic error state for other client-side load failures;
- shows a loading state while data is absent;
- sets title, `og:title`, `og:url`, and canonical URL;
- renders a ranklist container with:
  - `data-id="ranklist-content"`;
  - `data-ranklist-id`;
  - `data-row-count`;
- renders `StyledRanklist` with footer, filter, and table layout enabled.

The migration foundation preserves the data contract, public route, SSR behavior, core head metadata, NotFound behavior, stable test attributes, and a real Vue SRK table render. It intentionally keeps advanced renderer controls out of scope.

## Chosen Approach

Use a thin Vue route page plus a small Vue ranklist renderer wrapper.

The page owns route behavior:

- route path;
- SSR `asyncData`;
- page-level error and loading states;
- page head metadata;
- stable test attributes.

The renderer wrapper owns the minimum reusable SRK rendering boundary:

- convert SRK JSON to the renderer's static ranklist format;
- render `@algoux/standard-ranklist-renderer-component-vue`;
- expose stable row/team text for E2E verification through the real renderer output.

This is the right scope for the first visible route because it proves the real data/rendering chain without forcing the entire old React renderer surface into the first page slice.

## Alternatives Considered

### Full UI Parity First

This would port most of the old `StyledRanklistRenderer` at once. It provides more feature parity immediately, but it touches many UI behaviors and client-only interactions before the first visible route has a stable SSR/E2E foundation.

Rejected for this branch because the migration needs a narrow, verified route baseline first.

### Data-Only Ranklist Page

This would render ranklist title and row count without the Vue SRK renderer. It would be fast, but it would not prove the core visible page behavior users care about.

Rejected because the first visible page should exercise the actual SRK renderer dependency.

## Architecture

### Route Module

Create:

```text
src/client/modules/ranklist/ranklist.view.vue
```

The module will export a `routeView` for:

```text
/ranklist/:id
```

with:

```ts
RenderMethodKind.SSR
```

The page should use `asyncData({ ranklandApiService, to })` to fetch:

```ts
ranklandApiService.getRanklist({ uniqueKey: String(to.params.id) })
```

No direct axios, `fetch`, or app API client calls should be added for ranklist data.

### Renderer Wrapper

Create:

```text
src/client/components/rankland-ranklist.vue
```

The wrapper should:

- accept the SRK ranklist as a prop;
- compute `convertToStaticRanklist(ranklist)`;
- render `Ranklist` from `@algoux/standard-ranklist-renderer-component-vue`;
- keep behavior minimal and SSR-compatible.

Import the shared renderer stylesheet once from an existing global entry point or this wrapper:

```ts
import '@algoux/standard-ranklist-renderer-component-styles';
```

The implementation should prefer the package README usage pattern already available in `node_modules/@algoux/standard-ranklist-renderer-component-vue/README.md`.

### Head Metadata

Create:

```text
src/client/utils/title-format.util.ts
```

with the migrated title convention:

```text
<title> - RankLand
```

For ranklist `Test Contest 2024`, the document title should match:

```text
Test Contest 2024 - RankLand
```

The ranklist page should set:

- `title`;
- `og:title`;
- `og:url`;
- canonical link.

The URL can be derived from the current route path and should be stable enough for SSR/full-chain assertions. A future route config slice can centralize absolute production URL formatting.

### App Shell

The current `App.vue` still displays bwcx demo branding. This branch may make the shell neutral enough for the ranklist route, but it must not spend this slice on a complete global layout migration.

Acceptable shell work:

- add a plain RankLand home link;
- keep `<router-view>` rendering unchanged;
- avoid hiding or interfering with the ranklist page content.

## Data Flow

### SSR Initial Load

1. Browser requests `/ranklist/test-key`.
2. bwcx/Koa routes the request to the Vue SSR renderer.
3. The ranklist route `asyncData` calls `RanklandApiService.getRanklist`.
4. The service calls the configured controlled backend:
   - `GET /rank/test-key`;
   - `GET /file/download?id=file-test-1`.
5. SSR renders page markup containing:
   - ranklist title;
   - ranklist content container;
   - row count;
   - renderer table content from the SRK fixture.
6. Browser hydrates the page without replacing the API chain with Playwright mocks.

### CSR Navigation

The route must also support client-side navigation through Vue Router. If navigating between ranklist IDs in a later test, the page should refetch through `RanklandApiService` via route-level async data rather than directly calling the backend.

This branch only needs a hydration marker or visible stable assertion to prove the rendered page survives browser hydration.

## Error Handling

### NotFound

If `RanklandApiService.getRanklist` throws `RanklandLogicExceptionKind.NotFound`, the page should render:

```html
data-id="ranklist-not-found"
data-id="ranklist-not-found-home-link"
```

The visible text should match the old page closely:

```text
Ranklist Not Found
Back to Home
```

The title should be:

```text
Not Found - RankLand
```

### Generic Error

For non-NotFound errors, render a generic page-level error state:

```text
An error occurred while loading data
```

and a refresh action that reloads the current page.

Full-chain E2E for the generic error is optional in this slice because the controlled backend currently covers the successful and NotFound paths most directly. Unit coverage should make the generic branch explicit if the implementation factors error classification into a helper.

### Loading

Render a simple loading state when the component has neither data nor error. This mainly protects CSR transitions and mirrors the old React page behavior.

## Test Strategy

### Unit Tests

Add focused unit coverage for the route registry and any extracted helper:

- `/ranklist/:id` is registered in generated client route maps as SSR;
- `formatTitle('Test Contest 2024')` returns `Test Contest 2024 - RankLand`;
- `formatTitle()` returns `RankLand`;
- NotFound classification distinguishes RankLand NotFound from generic errors if implemented as a helper.

### SSR Smoke

Extend or add SSR smoke coverage for `/ranklist/test-key` only if the existing SSR harness can provide the needed RankLand API context without weakening the full-chain guarantee.

Do not replace the full-chain E2E requirement with SSR-only tests.

### Full-Chain E2E

Add:

```text
tests/e2e/full-chain/ranklist.spec.ts
```

Successful ranklist test:

- call `denyExternalCalls(page)`;
- reset the controlled backend request log with `request.post(mockBaseURL + '/__reset')`;
- navigate to `/ranklist/test-key`;
- assert HTTP response is OK;
- assert SSR response text contains `Test Contest 2024`;
- assert document title matches `Test Contest 2024 - RankLand`;
- assert `[data-id="ranklist-content"][data-ranklist-id="test-key"][data-row-count="2"]` is visible;
- assert renderer output includes both `Team Alpha` and `Team Beta`;
- assert a hydration marker or equivalent visible hydrated state is present;
- fetch `/__requests` from the controlled backend;
- assert backend received `/rank/test-key`;
- assert backend received `/file/download`;
- assert no assertion depends on `page.route` app API mocking.

NotFound test:

- configure the controlled backend so a selected key returns wrapped `code: 11` or HTTP 404 for `/rank/:key`;
- navigate to that missing `/ranklist/:id`;
- assert `data-id="ranklist-not-found"` is visible;
- assert home link exists and points to `/`;
- assert backend request log includes the missing rank path.

The controlled backend may need a test-only missing-key branch. That behavior should stay isolated in `tests/e2e/support/start-full-chain-e2e.js` and must not affect production code.

### Migration Gate

Final verification for this branch:

```bash
fnm exec --using v24.11.1 corepack pnpm test:migration
```

Also verify the full-chain launcher leaves no lingering app server, mock backend, inspector process, or occupied test ports after the run.

## Files Expected To Change

Expected implementation files:

- `src/client/modules/ranklist/ranklist.view.vue`
- `src/client/components/rankland-ranklist.vue`
- `src/client/utils/title-format.util.ts`
- generated route files:
  - `src/client/router/routes.ts`
  - `src/client/router/types.d.ts`
  - `src/common/router/client-routes.ts`
- `src/client/App.vue` only if needed for neutral shell behavior
- `tests/e2e/support/start-full-chain-e2e.js`
- `tests/e2e/full-chain/ranklist.spec.ts`
- focused unit tests under `tests/unit/`

Unexpected implementation files should be justified in the implementation plan before editing.

## Acceptance Criteria

- `/ranklist/test-key` exists as a public visible route.
- The route is SSR-rendered.
- The route fetches data only through `RanklandApiService`.
- The page renders `Test Contest 2024`, row count `2`, and real fixture team names.
- The page exposes the legacy stable selectors:
  - `data-id="ranklist-content"`;
  - `data-ranklist-id="test-key"`;
  - `data-row-count="2"`.
- The page handles NotFound with the legacy stable selectors.
- The full-chain ranklist E2E uses the existing controlled backend, not `page.route` API mocks.
- The existing hidden full-chain probe continues to pass.
- The full migration gate passes under Node 24:

```bash
fnm exec --using v24.11.1 corepack pnpm test:migration
```

## Risks

### Renderer SSR Compatibility

The Vue renderer package may include browser-sensitive behavior. The implementation should start with minimal package usage and verify SSR early. If the renderer cannot SSR safely, the fallback is to render a stable SSR summary plus mount the renderer client-side in a narrowly documented way. That fallback must still keep the page route SSR and must be called out in code review.

### Route Generation

`src/client/router/routes.ts` and `src/common/router/client-routes.ts` are generated files. The implementation plan should include a deterministic route generation step and verify generated output is committed.

### NotFound Through SSR

The old React page rethrows errors on the server. For this foundation, the Vue page should render NotFound as a page state so the visible route can be E2E-tested deterministically through the full-chain harness. Production HTTP status behavior can be revisited with the broader SSR error policy.

### Global Shell Noise

The demo shell may appear around the ranklist page. This is acceptable only if it does not break route functionality or E2E selectors. Full layout parity belongs to a later shell migration slice.

## Handoff Notes

Use spec-coding execution:

1. write an implementation plan from this spec;
2. execute with Subagent-Driven Development;
3. perform two review rounds for each task:
   - spec compliance review;
   - code quality review;
4. finish with the full Node 24 migration gate.

Do not merge or push this branch.
