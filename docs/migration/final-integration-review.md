# RankLand Final Integration Review

Date: 2026-05-26
Branch: `migration/live-page-foundation`

This review records the evidence used to treat `rankland-web` as the product-restored migrated RankLand frontend for the currently verified public surface. It supersedes the earlier 2026-05-23 route-compatible-only review: subsequent slices restored Ant Design Vue shell/content parity, analytics dispatch, collection layout behavior, Playground product behavior including old desktop flex layout, editor shell chrome cleanup, welcome modal right-top docs icon cue, invalid prompt shortcut tag spacing, removed Vue-only toolbar/preview-action chrome, and hidden internal probes, Live reconnect/Toastify behavior, SRK wrapper actions/layout/modals, user-modal legacy root, segment line, segment label, and slogan classes, rank-time chart-only chrome, and multiple low-level SRK renderer visual details.

The review still does not claim that every possible production SRK fixture has been pixel-reviewed against old React. Remaining lower-level table pixel parity is product-review-driven and should stay isolated in follow-up slices if new differences are found.

## Requirement Evidence

| Requirement | Evidence | Status |
| --- | --- | --- |
| Use Node 24 and pnpm 8 | `package.json` engines require Node `^24.0.0` and pnpm `^8.0.0`; local verification used `node v24.11.1` and `pnpm 8.15.9`. | Verified |
| Preserve public routes | `docs/migration/inventory.md`, `src/common/rankland-router/routes.ts`, `src/common/router/client-routes.ts`, and `src/client/router/routes.ts` all include `/`, `/search`, `/ranklist/:id`, `/collection/:id`, `/playground`, and `/live/:id`. | Verified |
| Preserve SSR/CSR boundary | `ranklandRoutes` marks `/`, `/ranklist/:id`, and `/collection/:id` as SSR; `/search`, `/playground`, and `/live/:id` as CSR. Generated route metadata uses `RenderMethodKind.SSR` for SSR routes and `undefined` for CSR routes. | Verified |
| Do not embed React | Migrated public route targets are Vue modules under `src/client/modules/**`; SRK rendering uses Vue/component-core packages and Vue wrapper code. | Verified |
| Do not hand-edit generated router outputs | Generated files retain the `DO NOT MODIFY IT BY HAND` header; `corepack pnpm run gen:client-router` is the one-shot generation gate and `gen:client-router:watch` is the dev watcher. | Verified |
| Keep RanklandApiService semantics | `src/common/rankland-api/rankland-api.service.ts` implements normal/CDN endpoints, NotFound mapping, cache reads/writes/deletes, and live ranklist methods; `tests/unit/rankland-api.service.spec.ts` covers endpoint URLs, cache behavior, and error mapping. | Verified |
| Keep API contract docs aligned | `docs/migration/api-contract.md` lists the same normal/CDN API methods and NotFound/error mapping covered by `RanklandApiService` tests. | Verified |
| Keep route inventory aligned | `docs/migration/inventory.md` maps each old React public route source to its Vue target module and render method. | Verified |
| Full-chain coverage for all public routes | `tests/e2e/full-chain/home.spec.ts`, `search.spec.ts`, `ranklist.spec.ts`, `collection.spec.ts`, `playground.spec.ts`, and `live.spec.ts` cover the migrated routes against the real app server and mock RankLand backend. | Verified |
| App shell/layout parity | `tests/e2e/full-chain/app-shell.spec.ts` covers Ant Design Vue Layout/Menu/Dropdown/Button shell structure, navigation, old global body light/dark text colors, old global body 14px/system-font/tabular-nums/1.5715 line-height typography, old nav menu 46px line-height, old dark primary nav selected/active/hover color and underline, site switch with old ArrowRight icon, old site-switch 32px button height/0px min-height/2px radius and 8px horizontal padding, desktop legacy 50px header padding/no centered max-width/no inner gap, mobile legacy 20px header padding/no inner padding/no inner gap, 64px header/logo container, 40px logo image, 16px nav item padding, focus-mode shell bypass, pre-hydration theme bootstrap, theme/macOS class sync, legacy `Title \| RankLand` document-title behavior on CSR navigation, analytics dispatch, fallback 404, and desktop/mobile viewport bounds. Home full-chain coverage now also verifies old `main.normal-content` and `.home-intro` wrapper DOM, old `div.block` content group DOM, old `normal-content` padding, no desktop max-width cap, old `home-intro` block spacing, old `h1.block-title` section heading DOM/typography, old statistics nullish `-` fallback across SSR/hydration, old total SRK count `strong` DOM and bold/non-italic presentation, old card paragraph `mt-4 mb-0` 16px/0px spacing, old dark Ant Design Card background, border, radius, inherited text color, and old dark non-card body text color for hero/resource/about copy. | Verified |
| Contact modal parity foundation | `src/client/components/contact-us.vue` is shared by home/ranklist footer surfaces and now uses ant-design-vue `Modal`; full-chain tests cover open/close, email, QQ image, and old dark Ant Design modal content/title/close/body padding styles. | Verified |
| Search page parity | `tests/e2e/full-chain/search.spec.ts` covers CSR list-all loading, hidden hydration marker, old `normal-content` padding, `h3.mb-6`, Ant Design Vue `Input.Search` with old boolean `enterButton` default SearchOutlined icon button, `List`/`Spin`, local Fuse search, empty `kw`, zero-result summary-only behavior, row metadata typography, old recent-empty dark text color, and old load-error message/40px spacing/`text-red-500` color. | Verified |
| Playground page parity | `tests/e2e/full-chain/playground.spec.ts` covers CSR hydration, old desktop flex layout with 500px editor and growing preview pane, no Vue-only editor wrapper border/radius, absence of the Vue-only page-level `Playground` toolbar/heading, absence of the Vue-only visible `Preview` button, hidden hydration marker, hidden editor-ready marker, Monaco readiness/schema/theme, one-time welcome modal including old right-top `QuestionCircleOutlined` docs cue copy, preview docs link/icon placement, invalid JSON state and shortcut tag `mr-0` spacing, render-error Alert, bundled preview rendering, desktop/mobile viewport bounds, and no upstream calls. | Verified |
| SRK renderer wrapper migrated behavior | `src/client/components/rankland-ranklist.vue` and related helpers cover Ant Design Vue filter/progress/header actions, old header title 32px/500/4px typography, old header meta/contributors/ref-links/time 14px text size, old header meta-to-contributors spacing, old header non-link metadata light/dark text colors, old header/footer link primary colors and hover colors, old header export/share action icon primary and hover colors, hidden ref-link trigger inherited text color, hover dropdowns, export/share actions, embed code, render-error Alert, modal clicks, user modal details including old `.user-modal` root class, old `mt-4 mb-0` award line classes, old `.user-modal-segment-label` award label class, old `.slogan` slogan class, and old dark body text color, old chart-only rank-time `mt-4` wrapper with no extra unit/summary/event chrome, G2 rank-time chart, asset URL rewriting, footer/contact prompt, conditional beian footer, live controls, route spacing, table wrapper offset/top spacing, remarks pill styling with old light/dark primary rgba borders, dark-theme propagation, macOS Blink table-header override, and SRK status score spacing; unit and full-chain tests cover those behaviors. | Verified |
| Live page parity | `tests/e2e/full-chain/live.spec.ts` covers CSR hydration, hidden hydration marker behavior, query preservation, polling, WebSocket setup guard, realtime event display, WebSocket error/close reconnect, scroll-solution Switch shape/state/old 4px spacing/old 14px and light `rgba(0, 0, 0, 0.85)` text style, scroll-solution toggle close, query preservation, mobile toggle hiding, Toastify row/container/Zoom presentation, user-modal rank-time chart-only chrome plus G2 metadata/canvas, NotFound, loading/error states, normal live screenshots, realtime screenshots, and mobile progress bounds. | Verified |
| Page-level visual review | Full-chain visual/layout tests produce screenshots and assert viewport bounds for app shell, home, search, ranklist, collection, playground, and live normal/realtime views. | Verified |
| Final migration gate | 2026-05-27 user modal segment line class parity slice passed focused Ranklist RED/GREEN and `corepack pnpm test:migration` with build, 35 unit files / 151 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 54 full-chain Playwright tests; `git diff --check` also passed. | Verified |
| Production deployment, remote push, branch merge, or old implementation deletion | Explicitly out of scope for this migration working branch unless requested by Cooper. | Not performed |

## Deferred Product Decisions

These are not hidden blockers for the currently verified product-restoration surface. They are explicit follow-up decisions or review-driven areas.

- Home: broader SEO/content polish beyond verified structured data, SSR content, legacy `main.normal-content` / `.home-intro` wrapper DOM, legacy `div.block` content group DOM, legacy normal-content/block spacing, legacy `h1.block-title` section headings, legacy statistics nullish fallback, legacy statistics `strong` presentation, Ant Design content layout, recommendation card dark Ant Design Card token parity, non-card dark text color parity, recommendation card heading/icon parity, card title icon/logo spacing parity, card paragraph `mt-4 mb-0` spacing parity, paste.then.ac logo padding parity, and shared Ant Design Vue contact modal behavior remains accepted as non-blocking.
- Search: old boolean `enterButton` default SearchOutlined icon button and old load-error `text-red-500` color are now verified alongside prior normal-content, Ant Design Input.Search/List/Spin, hydration marker, recent/result rows, and zero-result behavior.
- Collection: old `.srk-collection-ranklist` `position: relative` / `flex: 1`, old collapsed submenu-title 0px horizontal padding, `.srk-collection-container` / `.srk-collection-nav` / `.srk-collection-ranklist` shell classes, nav `z-index: 1`, hidden-header `z-index: auto`, old light `#f4f4f4` and dark `#111111` nav background, dark `#434343` nav border, and old `.srk-collection-hidden-header h3.mb-0` hidden-title DOM are now verified alongside prior Ant Design Vue menu/category icon/mobile collapse/remaining-height behavior.
- Live: old scroll-solution toggle text-to-switch spacing is now verified at 4px and the toggle text style is verified at 14px plus light `rgba(0, 0, 0, 0.85)` alongside prior Ant Design Vue Switch shape/state, WebSocket reconnect/close, Toastify container, and realtime layout behavior.
- Playground: exact old Monaco `0.34.0` package-version parity is intentionally not preserved because the verified Vue wrapper requires Monaco `>=0.43.0`; synthetic Monaco editing remains a harness limitation, while the product editor path, old desktop flex/500px layout, no Vue-only editor wrapper border/radius, welcome modal old right-top `QuestionCircleOutlined` docs cue copy, invalid prompt shortcut tag `mr-0` spacing, absence of the Vue-only toolbar/heading and visible Preview button, hidden hydration/editor-ready markers, preview-pane `QuestionCircleOutlined` docs link, and stable preview coverage are verified by build/hydration and full-chain tests. Mobile keeps the migrated no-horizontal-overflow guard.
- SRK renderer wrapper: old header title typography is now verified at 32px/500/4px, old header meta/contributors/ref-links/time text size is verified at 14px, old header export/share action icons are verified with light/dark primary plus hover colors, and user-modal body restores the old `.user-modal` root class while the award line restores old `mt-4 mb-0`, the award label restores the old `.user-modal-segment-label` class, and the slogan restores the old `.slogan` class; rank-time is restored to the old chart-only `mt-4` wrapper and G2 tooltip/animation behavior; remaining lower-level exact table pixel parity should be handled only when product review identifies a concrete difference.
- Production deployment, remote push, branch merge, and old implementation deletion remain out of scope unless requested.

## Final Gate Commands

Run these from `/Users/cooper/Projects/RankLand/rankland-web` with Node 24 and pnpm 8:

```bash
node -v
corepack pnpm -v
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

The final review is accepted only after the fresh commands pass and generated router outputs do not drift unexpectedly.

## Final Gate Result

Fresh verification on 2026-05-27:

- `node -v`: `v24.11.1`
- `corepack pnpm -v`: `8.15.9`
- `corepack pnpm run gen:client-router`: generated 8 client routes, exited cleanly; warning only: `Skipped due to language "js" is not supported. Only [ts,tsx] are supported (file: src/client/modules/fallback/not-found.view.vue)`
- `corepack pnpm test:migration`: passed build, 35 unit files / 151 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 54 full-chain Playwright tests during the user modal segment line class parity verification
- `git diff --check`: passed
