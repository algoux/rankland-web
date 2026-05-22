# RankLand Migration Status

This file is the quick global dashboard for the RankLand migration. Update it at the end of every verified slice or when a slice's state materially changes.

## Current Focus

- Active branch: `migration/live-page-foundation`
- Current slice: live page visual review
- Latest slice commit: `test: 补充实时榜单页面视觉审查` (this commit)
- Last recorded full gate: `FULL_CHAIN_APP_PORT=3210 FULL_CHAIN_MOCK_PORT=3211 corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/live.spec.ts` passed 7 `/live/:id` full-chain tests and produced normal/realtime live desktop/mobile screenshots
- Next recommended focus: migration completion audit and product-decision documentation for deferred parity items

## Route Progress

| Route | Render | Status | Branch / Slice | Coverage | Remaining parity / risk |
| --- | --- | --- | --- | --- | --- |
| `/` | SSR | Foundation + app shell + contact modal + visual review verified | `migration/live-page-foundation` | SSR smoke, shallow E2E, full-chain E2E, app shell/theme full-chain E2E, app shell desktop/mobile screenshot review, contact modal full-chain E2E, home desktop/mobile screenshot review | Exact Ant Design shell styling, broader SEO consistency |
| `/search` | CSR | Foundation + visual review verified | `migration/live-page-foundation` | Unit, generated route, full-chain E2E, search desktop/mobile screenshot review | Product polish after route parity review |
| `/ranklist/:id` | SSR | Foundation + shared wrapper parity follow-ups + visual review verified | `migration/live-page-foundation` | Unit, route, full-chain E2E including footer contact modal, ranklist desktop/mobile screenshot review | Product polish after route parity review |
| `/collection/:id` | SSR | Foundation + visual review verified | `migration/live-page-foundation` | Unit, route, full-chain E2E, collection desktop/mobile screenshot review | Exact menu/mobile/category icon parity |
| `/playground` | CSR | Foundation + visual review verified | `migration/live-page-foundation` | Unit, route, full-chain E2E, playground desktop/mobile screenshot review | Monaco/editor parity and UX polish |
| `/live/:id` | CSR | Foundation + parity follow-ups + visual review verified | `migration/live-page-foundation` | Unit, route, full-chain E2E including NotFound, WebSocket error, unexpected WebSocket close, scroll-solution toggle close, mobile toggle visibility, hidden internal status marker, desktop/mobile realtime layout bounds, normal live desktop/mobile screenshot review, and mobile progress label bounds | Product review; exact Toastify animation/pixel parity deferred as product enhancement |

## Infrastructure Progress

| Area | Status | Notes |
| --- | --- | --- |
| Node / package manager | Done | Node 24, pnpm 8 |
| RankLand API service | Done | Normal/CDN API adapters, cache behavior, error mapping |
| Route builders | Done | Public route builders and generated route coverage |
| SRK Vue wrapper | Foundation + live controls + modal clicks + rank-time user modal + asset URL rewriting + basic export/share + converter-backed exports + footer contact prompt done | Remaining `StyledRanklistRenderer` parity is product/visual review driven |
| Full-chain E2E harness | Done | Real bwcx/Koa app plus controlled mock RankLand backend |
| Vue app shell | Foundation + contact modal + theme sync + visual review verified | Logo, primary navigation, site switch, BackTop, legacy focus-mode shell bypass, shared contact modal, system theme class sync, macOS Blink optimization class, desktop/mobile viewport bounds, and screenshot review are covered by full-chain E2E. Exact Ant Design/GA parity remains product polish. |
| Migration process | Active | Slice workflow, conversation I/O protocol, and this dashboard are in `docs/migration` |

## Open Decisions

- Whether to prioritize remaining SRK renderer wrapper parity before visual app shell parity.
- Whether live page product review should produce one broad polish slice or several small parity slices.
- Whether app shell polish should prioritize exact Ant Design styling, analytics/pageview parity, or page-specific visual reviews.

## Known Risks

- Route foundations preserve core behavior but do not yet guarantee exact visual parity with old React/Ant Design pages.
- Vue app shell now preserves the basic legacy chrome, focus-mode bypass, contact modal, system theme class sync, macOS Blink optimization class, and desktop/mobile viewport bounds, but exact Ant Design menu/dropdown styling and GA pageview dispatch are still deferred.
- Live realtime behavior has deterministic success, NotFound, WebSocket error, unexpected WebSocket close, scroll-solution toggle close, mobile toggle visibility, hidden internal status marker, desktop/mobile realtime layout bounds, normal live desktop/mobile page review, and mobile progress label bounds coverage. Automatic WebSocket reconnect/backoff and exact React Toastify animation/pixel parity are intentionally deferred as product enhancements.
- SRK renderer wrapper is shared by multiple migrated routes, so remaining parity changes should be isolated and heavily tested.
- Converter-backed SRK exports use lazy browser imports of `@algoux/standard-ranklist-convert-to@0.2.2`; `xlsx@0.18.5` remains a large but click-loaded dependency.
- User modal rank-time parity uses a lightweight Vue/SVG curve instead of the old React `@antv/g2` chart, so exact tooltip and animation parity remains intentionally deferred.

## Next Slice Queue

1. Migration completion audit: run broader gates and align docs with final deferred parity decisions.
2. Collection product parity decisions: exact menu/mobile/category icon behavior.
3. Playground product parity decisions: Monaco/editor parity and UX polish.
4. App shell remaining product decisions: exact Ant Design styling and analytics/pageview behavior.
5. Live product parity decisions: automatic WebSocket reconnect/backoff and exact Toastify animation/pixel behavior.
