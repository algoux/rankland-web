# RankLand Migration Status

This file is the quick global dashboard for the RankLand migration. Update it at the end of every verified slice or when a slice's state materially changes.

## Current Focus

- Active branch: `migration/live-page-foundation`
- Current slice: live scroll-solution status visibility polish
- Latest slice commit: `fix: 隐藏实时榜单内部状态行` (this commit)
- Last recorded full gate: `FULL_CHAIN_APP_PORT=3210 FULL_CHAIN_MOCK_PORT=3211 corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/live.spec.ts` passed 5 `/live/:id` full-chain tests
- Next recommended focus: continue live realtime event display polish or move to app shell/layout parity

## Route Progress

| Route | Render | Status | Branch / Slice | Coverage | Remaining parity / risk |
| --- | --- | --- | --- | --- | --- |
| `/` | SSR | Foundation verified | `migration/home-page-foundation` | SSR smoke, shallow E2E, full-chain E2E | Contact modal, full app shell/layout parity, broader SEO consistency |
| `/search` | CSR | Foundation verified | `migration/search-page-foundation` | Unit, generated route, full-chain E2E | Product polish after route parity review |
| `/ranklist/:id` | SSR | Foundation + shared wrapper parity follow-ups verified | `migration/live-page-foundation` | Unit, route, full-chain E2E | Product polish after route parity review |
| `/collection/:id` | SSR | Foundation verified | `migration/collection-page-foundation` | Unit, route, full-chain E2E | Exact menu/mobile/category icon parity |
| `/playground` | CSR | Foundation verified | `migration/playground-page-foundation` | Unit, route, full-chain E2E | Monaco/editor parity and UX polish |
| `/live/:id` | CSR | Foundation + parity follow-ups verified | `migration/live-page-foundation` | Unit, route, full-chain E2E including NotFound, WebSocket error, unexpected WebSocket close, scroll-solution toggle close, mobile toggle visibility, and hidden internal status marker | Product review, realtime event display polish |

## Infrastructure Progress

| Area | Status | Notes |
| --- | --- | --- |
| Node / package manager | Done | Node 24, pnpm 8 |
| RankLand API service | Done | Normal/CDN API adapters, cache behavior, error mapping |
| Route builders | Done | Public route builders and generated route coverage |
| SRK Vue wrapper | Foundation + live controls + modal clicks + rank-time user modal + asset URL rewriting + basic export/share + converter-backed exports done | Remaining `StyledRanklistRenderer` parity is product/visual review driven |
| Full-chain E2E harness | Done | Real bwcx/Koa app plus controlled mock RankLand backend |
| Migration process | Active | Slice workflow, conversation I/O protocol, and this dashboard are in `docs/migration` |

## Open Decisions

- Whether to prioritize remaining SRK renderer wrapper parity before visual app shell parity.
- Whether live page product review should produce one broad polish slice or several small parity slices.
- Whether to introduce a fuller Vue app shell before or after route-level parity review.

## Known Risks

- Route foundations preserve core behavior but do not yet guarantee exact visual parity with old React/Ant Design pages.
- Live realtime behavior has deterministic success, NotFound, WebSocket error, unexpected WebSocket close, scroll-solution toggle close, mobile toggle visibility, and hidden internal status marker coverage. Automatic WebSocket reconnect/backoff is intentionally deferred as a product enhancement because the old React page did not reconnect after close/error.
- SRK renderer wrapper is shared by multiple migrated routes, so remaining parity changes should be isolated and heavily tested.
- Converter-backed SRK exports use lazy browser imports of `@algoux/standard-ranklist-convert-to@0.2.2`; `xlsx@0.18.5` remains a large but click-loaded dependency.
- User modal rank-time parity uses a lightweight Vue/SVG curve instead of the old React `@antv/g2` chart, so exact tooltip and animation parity remains intentionally deferred.

## Next Slice Queue

1. Live product review and remaining parity gaps.
2. App shell/layout parity.
3. Page-specific polish from product review.
