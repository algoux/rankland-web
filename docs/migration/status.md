# RankLand Migration Status

This file is the quick global dashboard for the RankLand migration. Update it at the end of every verified slice or when a slice's state materially changes.

## Current Focus

- Active branch: `migration/live-page-foundation`
- Current slice: acceptance preflight
- Latest slice commit: `test: 稳定首页移动端视觉门禁` (this commit)
- Last recorded full gate: `corepack pnpm test:migration` passed build, 24 unit files / 120 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 32 full-chain Playwright tests across all migrated public routes during 2026-05-25 acceptance preflight
- Next recommended focus: accept the route-compatible migration with deferred product decisions, or choose one deferred product-polish slice

## Route Progress

| Route | Render | Status | Branch / Slice | Coverage | Remaining parity / risk |
| --- | --- | --- | --- | --- | --- |
| `/` | SSR | Foundation + app shell + contact modal + visual review + completion audit verified | `migration/live-page-foundation` | SSR smoke, shallow E2E, full-chain E2E, app shell/theme full-chain E2E, app shell desktop/mobile screenshot review, contact modal full-chain E2E, home desktop/mobile screenshot review, `test:migration` | Exact Ant Design shell styling and broader SEO consistency are deferred product polish |
| `/search` | CSR | Foundation + visual review + completion audit verified | `migration/live-page-foundation` | Unit, generated route, full-chain E2E, search desktop/mobile screenshot review, `test:migration` | Product polish after route parity review |
| `/ranklist/:id` | SSR | Foundation + shared wrapper parity follow-ups + visual review + completion audit verified | `migration/live-page-foundation` | Unit, route, full-chain E2E including footer contact modal, ranklist desktop/mobile screenshot review, `test:migration` | Product polish after route parity review |
| `/collection/:id` | SSR | Foundation + visual review + completion audit verified | `migration/live-page-foundation` | Unit, route, full-chain E2E, collection desktop/mobile screenshot review, `test:migration` | Exact menu/mobile/category icon parity is deferred product polish |
| `/playground` | CSR | Foundation + visual review + completion audit verified | `migration/live-page-foundation` | Unit, route, full-chain E2E, playground desktop/mobile screenshot review, `test:migration` | Monaco/editor parity and UX polish are deferred product polish |
| `/live/:id` | CSR | Foundation + parity follow-ups + visual review + completion audit verified | `migration/live-page-foundation` | Unit, route, full-chain E2E including NotFound, WebSocket error, unexpected WebSocket close, scroll-solution toggle close, mobile toggle visibility, hidden internal status marker, desktop/mobile realtime layout bounds, normal live desktop/mobile screenshot review, mobile progress label bounds, and `test:migration` | Automatic WebSocket reconnect/backoff and exact Toastify animation/pixel parity are deferred product enhancements |

## Infrastructure Progress

| Area | Status | Notes |
| --- | --- | --- |
| Node / package manager | Done | Node 24, pnpm 8 |
| RankLand API service | Done | Normal/CDN API adapters, cache behavior, error mapping |
| Route builders | Done | Public route builders and generated route coverage. `corepack pnpm run gen:client-router` now exits after one-shot generation; `gen:client-router:watch` preserves dev-time watch mode. |
| SRK Vue wrapper | Foundation + live controls + modal clicks + rank-time user modal + asset URL rewriting + basic export/share + converter-backed exports + footer contact prompt done | Remaining `StyledRanklistRenderer` parity is product/visual review driven |
| Full-chain E2E harness | Done | Real bwcx/Koa app plus controlled mock RankLand backend |
| Vue app shell | Foundation + contact modal + theme sync + visual review verified | Logo, primary navigation, site switch, BackTop, legacy focus-mode shell bypass, shared contact modal, system theme class sync, macOS Blink optimization class, desktop/mobile viewport bounds, and screenshot review are covered by full-chain E2E. Exact Ant Design/GA parity remains product polish. |
| Migration process | Final review verified | Slice workflow, conversation I/O protocol, this dashboard, completion audit, and final integration review are in `docs/migration` and `docs/superpowers` |

## Deferred Product Decisions

- App shell: exact Ant Design menu/dropdown styling and GA/pageview dispatch parity remain product polish.
- Home: broader SEO/content polish beyond the verified structured-data and SSR smoke coverage remains product polish.
- Collection: exact legacy menu, mobile, and category icon behavior remains product polish.
- Playground: Monaco/editor parity and editor UX polish remain product polish.
- Live: automatic WebSocket reconnect/backoff and exact Toastify animation/pixel behavior remain product enhancements.
- SRK renderer wrapper: any remaining exact `StyledRanklistRenderer` visual parity should be handled by product-review-driven slices.

## Known Risks

- Route foundations preserve core route compatibility and audited full-chain behavior, but do not claim pixel-perfect parity with old React/Ant Design pages.
- Vue app shell now preserves the basic legacy chrome, focus-mode bypass, contact modal, system theme class sync, macOS Blink optimization class, and desktop/mobile viewport bounds, but exact Ant Design menu/dropdown styling and GA pageview dispatch are still deferred.
- Live realtime behavior has deterministic success, NotFound, WebSocket error, unexpected WebSocket close, scroll-solution toggle close, mobile toggle visibility, hidden internal status marker, desktop/mobile realtime layout bounds, normal live desktop/mobile page review, and mobile progress label bounds coverage. Automatic WebSocket reconnect/backoff and exact React Toastify animation/pixel parity are intentionally deferred as product enhancements.
- SRK renderer wrapper is shared by multiple migrated routes, so remaining parity changes should be isolated and heavily tested.
- Converter-backed SRK exports use lazy browser imports of `@algoux/standard-ranklist-convert-to@0.2.2`; `xlsx@0.18.5` remains a large but click-loaded dependency.
- User modal rank-time parity uses a lightweight Vue/SVG curve instead of the old React `@antv/g2` chart, so exact tooltip and animation parity remains intentionally deferred.

## Next Slice Queue

1. Accept route-compatible migration as complete with deferred product decisions, or open one product-polish follow-up.
2. Collection product parity: exact menu/mobile/category icon behavior.
3. Playground product parity: Monaco/editor parity and UX polish.
4. App shell product parity: exact Ant Design styling and analytics/pageview behavior.
5. Live product parity: automatic WebSocket reconnect/backoff and exact Toastify animation/pixel behavior.
