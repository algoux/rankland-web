# Home Page Foundation Design

## Context

This slice starts from `migration/home-page-foundation`, branched from the verified collection baseline.

The current migration stack already has:

- Node 24 and pnpm 8 baseline;
- RankLand API service and SSR/CSR injection;
- `/ranklist/:id` and `/collection/:id` SSR foundation routes;
- full-chain Playwright harness backed by a controlled RankLand API mock;
- deterministic `statistics.json` fixture served by the full-chain mock backend.

The current `/` route is still the bwcx demo home. It calls the demo API and renders template copy. The old React source home is:

```text
/Users/cooper/Projects/RankLand/rankland-fe/src/pages/index.tsx
```

This branch migrates the first real RankLand home foundation:

```text
/
```

## Goal

Replace the demo `/` route with a real SSR RankLand home page that loads statistics through `RanklandApiService`, renders the old home page's core content and SEO metadata, hydrates cleanly, and is covered by full-chain E2E.

## Non-Goals

This branch does not attempt full global layout parity. These remain later migration slices:

- exact old React layout header and right menu;
- `ContactUs` modal with QQ group image;
- full `BeianLink` component parity and runtime BEIAN configuration;
- Ant Design Vue card/icon parity;
- search page migration;
- full visual redesign.

The branch may remove the visible bwcx demo chrome from `App.vue` because a real home page should not appear below demo scaffold. The replacement shell stays minimal and should not become the full RankLand app layout.

## Existing Source Behavior

The old React home page:

- SSR-loads `api.getStatistics()`;
- sets title to `RankLand`;
- sets `og:title`, `og:url`, and canonical URL;
- emits WebSite JSON-LD with SearchAction targeting `/search?kw={search_term_string}`;
- emits SiteNavigationElement JSON-LD for `探索` and `榜单合集`;
- renders welcome heading and intro copy;
- renders recommendation cards for `/search` and `/collection/official`;
- renders external cards for `paste.then.ac` and `Algo Bootstrap`;
- renders resource links for SRK ecosystem projects;
- renders contact, about, GitHub, copyright, total view count, algoux home, and service status links;
- renders ICP link only when `SITE_ALIAS === 'cnn'`.

## Chosen Approach

Use a single Vue route page plus a tiny site URL helper.

The page owns:

- route path `/`;
- SSR `asyncData`;
- page head metadata and JSON-LD;
- stable test attributes;
- foundation content sections;
- hydration marker.

The helper owns:

- site origin fallback;
- absolute URL construction for SEO metadata and JSON-LD.

Use `ranklandApiService.getStatistics()` from `asyncData`; do not add direct axios, `fetch`, or demo `apiClient` calls.

## Architecture

### Route Module

Modify:

```text
src/client/modules/home/home.view.vue
```

The module remains:

```text
routeView(HomePage, '/', undefined, undefined, { renderMethod: RenderMethodKind.SSR })
```

`asyncData({ ranklandApiService })` fetches:

```ts
const statistics = await ranklandApiService.getStatistics();
```

As in the old React page, SSR load errors should propagate rather than render a silent fake home. Client-side route navigation may return an absent statistics value only if a future error boundary supplies one.

### Site URL Helper

Create:

```text
src/client/modules/home/home-site.ts
```

The helper should use:

- `process.env.RANKLAND_SITE_ORIGIN` when defined;
- otherwise `https://rl.algoux.cn` when `process.env.RANKLAND_SITE_ALIAS === 'cnn'` or `process.env.SITE_ALIAS === 'cnn'`;
- otherwise `https://rl.algoux.org`.

It should expose:

```ts
getHomeSiteOrigin(): string
buildHomeAbsoluteUrl(path: string): string
```

This keeps SEO URL logic testable without changing shared API service or router code.

### App Shell

Modify:

```text
src/client/App.vue
src/client/index.less
```

Remove visible bwcx demo scaffold. Keep a minimal SSR-safe app shell with only `<router-view>` and a constrained main surface. This is not the full old RankLand layout migration.

### Page Rendering

Required stable attributes:

```text
data-id="home-content"
data-id="home-hero"
data-id="home-recommendations"
data-id="home-recommendation-search"
data-id="home-recommendation-collection"
data-id="home-total-srk-count"
data-id="home-tools"
data-id="home-tool-paste-then-ac"
data-id="home-tool-algo-bootstrap"
data-id="home-resources"
data-id="home-contact"
data-id="home-about"
data-id="home-total-view-count"
data-id="home-hydrated"
```

Use text links and simple cards instead of introducing Ant Design Vue dependencies into this slice.

### Assets

Copy these old assets into the home module:

```text
rankland-fe/src/assets/paste-then-ac_logo.png
rankland-fe/src/assets/algo-bootstrap_logo.png
```

Target paths:

```text
src/client/modules/home/assets/paste-then-ac_logo.png
src/client/modules/home/assets/algo-bootstrap_logo.png
```

Do not port `rankland_qqgroup.jpg` in this foundation because the modal is out of scope.

## Data Flow

SSR request:

```text
GET /
  -> bwcx/Koa view route
  -> vite-ssr entry-server
  -> router.beforeResolve
  -> home asyncData
  -> RanklandApiService.getStatistics()
  -> controlled API backend /statistics in full-chain tests
  -> SSR HTML with heading, statistics, SEO metadata, and JSON-LD
```

Browser hydration:

```text
SSR HTML
  -> Vue hydration
  -> mounted sets home-hydrated text from ssr to hydrated
```

## Test Strategy

Write tests before implementation:

- `tests/unit/home-site.spec.ts` for site origin and absolute URL helper;
- `tests/e2e/full-chain/home.spec.ts` for real bwcx/Koa SSR and mock backend `/statistics`;
- update `tests/e2e/home.spec.ts` for shallow Vite smoke;
- update `tests/ssr/smoke.spec.ts` mock path from demo API to `/api/statistics` and assert home HTML.

The full-chain home test should assert:

- `page.goto('/')` is OK;
- response HTML contains `欢迎来到 RankLand`;
- title is `RankLand`;
- visible statistics show fixture values `1234` and `56789`;
- recommendation links point to `/search` and `/collection/official`;
- hydration marker becomes `hydrated`;
- mock backend records exactly one `/statistics` request for initial render;
- no `/rank/listall`, `/rank/search`, `/rank/test-key`, or `/file/download` request is made.

## Acceptance Criteria

- `/` is an SSR RankLand home page, not a bwcx demo page.
- Home SSR uses `RanklandApiService.getStatistics()`.
- Home title, `og:title`, `og:url`, canonical, and JSON-LD are rendered.
- Core old-home content sections are present with stable selectors.
- Full-chain E2E covers SSR, hydration, statistics data, and upstream mock requests.
- SSR smoke and shallow E2E are updated away from demo assumptions.
- `corepack pnpm test:migration` passes under Node 24.

## Known Risks

### JSON-LD Escaping

Risk:

- Vue head rendering can escape script content if JSON-LD is inserted incorrectly.

Mitigation:

- Use `useHead` script children with JSON strings and verify rendered HTML in full-chain response text.

### Site Origin Drift

Risk:

- Existing migrated ranklist and collection pages currently use relative canonical URLs while old React home uses absolute URLs.

Mitigation:

- Keep absolute URL behavior local to home through `home-site.ts`. A later SEO consistency slice can generalize it.

### App Shell Side Effects

Risk:

- Removing demo chrome affects every route visually.

Mitigation:

- Keep the shell minimal and avoid changing route registration, API service, generated router files, or route behavior.

### Contact Modal Parity

Risk:

- Old home lets users open a contact modal with a QQ group image.

Mitigation:

- Foundation renders visible contact email/link content and records modal parity as out of scope.
