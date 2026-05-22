# RankLand Final Integration Review

Date: 2026-05-23
Branch: `migration/live-page-foundation`

This review records the evidence used to treat `rankland-web` as the route-compatible migrated RankLand frontend. It does not claim pixel-perfect parity with the old React/Ant Design implementation. Product-polish differences that remain are explicitly deferred below.

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
| App shell/layout parity foundation | `tests/e2e/full-chain/app-shell.spec.ts` covers navigation, site switch, focus-mode shell bypass, theme/macOS class sync, and desktop/mobile viewport bounds. | Verified |
| Contact modal parity foundation | `src/client/components/contact-us.vue` is shared by home/ranklist footer surfaces; full-chain tests cover open/close, email, and QQ image. | Verified |
| SRK renderer wrapper migrated behavior | `src/client/components/rankland-ranklist.vue` and related helpers cover filter/progress state, modal clicks, rank-time panel, asset URL rewriting, export/share actions, embed code, footer/contact prompt, and live controls; unit and full-chain tests cover those behaviors. | Verified |
| Live page parity foundation | `tests/e2e/full-chain/live.spec.ts` covers CSR hydration, query preservation, polling, WebSocket setup guard, realtime event display, WebSocket error/close handling, scroll-solution toggle close, mobile toggle hiding, NotFound, and desktop/mobile screenshots. | Verified |
| Page-level visual review | Full-chain visual/layout tests produce screenshots and assert viewport bounds for app shell, home, search, ranklist, collection, playground, and live normal/realtime views. | Verified |
| Final migration gate | `corepack pnpm test:migration` passed build, 24 unit files / 120 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 32 full-chain Playwright tests. | Verified |
| Production deployment, remote push, branch merge, or old implementation deletion | Explicitly out of scope for this migration working branch unless requested by Cooper. | Not performed |

## Deferred Product Decisions

These are not hidden blockers for route-compatible migration completion. They are product-polish decisions to handle in follow-up slices if desired.

- App shell: exact Ant Design menu/dropdown styling and GA/pageview dispatch parity.
- Home: broader SEO/content polish beyond verified structured data and SSR smoke behavior.
- Collection: exact legacy menu, mobile, and category icon behavior.
- Playground: Monaco/editor parity and editor UX polish.
- Live: automatic WebSocket reconnect/backoff and exact Toastify animation/pixel behavior.
- SRK renderer wrapper: any remaining exact `StyledRanklistRenderer` visual parity after product review.
- User rank-time modal: exact old React `@antv/g2` tooltip and animation parity; the migrated Vue implementation uses a lightweight SVG curve.

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

Fresh verification on 2026-05-23:

- `node -v`: `v24.11.1`
- `corepack pnpm -v`: `8.15.9`
- `corepack pnpm run gen:client-router`: generated 8 client routes, exited cleanly, and produced no generated route diff
- `corepack pnpm test:migration`: passed build, 24 unit files / 120 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 32 full-chain Playwright tests
