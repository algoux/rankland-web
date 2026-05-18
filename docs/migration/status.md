# RankLand Migration Status

This file is the quick global dashboard for the RankLand migration. Update it at the end of every verified slice or when a slice's state materially changes.

## Current Focus

- Active branch: `migration/live-page-foundation`
- Current slice: `/live/:id` parity follow-up
- Latest slice commit: `6e4918d feat: 补齐实时榜单渲染控件`
- Last recorded full gate: `corepack pnpm test:migration` passed in `docs/superpowers/plans/2026-05-18-live-renderer-controls-parity.md`
- Next recommended focus: product review of live parity gaps, then SRK renderer wrapper parity or remaining page-specific polish

## Route Progress

| Route | Render | Status | Branch / Slice | Coverage | Remaining parity / risk |
| --- | --- | --- | --- | --- | --- |
| `/` | SSR | Foundation verified | `migration/home-page-foundation` | SSR smoke, shallow E2E, full-chain E2E | Contact modal, full app shell/layout parity, broader SEO consistency |
| `/search` | CSR | Foundation verified | `migration/search-page-foundation` | Unit, generated route, full-chain E2E | Product polish after route parity review |
| `/ranklist/:id` | SSR | Foundation verified | `migration/ranklist-page-foundation` | Unit, route, full-chain E2E | SRK renderer wrapper parity beyond foundation table |
| `/collection/:id` | SSR | Foundation verified | `migration/collection-page-foundation` | Unit, route, full-chain E2E | Exact menu/mobile/category icon parity |
| `/playground` | CSR | Foundation verified | `migration/playground-page-foundation` | Unit, route, full-chain E2E | Monaco/editor parity and UX polish |
| `/live/:id` | CSR | Foundation + parity follow-ups verified | `migration/live-page-foundation` | Unit, route, full-chain E2E | Product review, realtime edge cases, renderer-wrapper parity gaps |

## Infrastructure Progress

| Area | Status | Notes |
| --- | --- | --- |
| Node / package manager | Done | Node 24, pnpm 8 |
| RankLand API service | Done | Normal/CDN API adapters, cache behavior, error mapping |
| Route builders | Done | Public route builders and generated route coverage |
| SRK Vue wrapper | Foundation done | Needs broader `StyledRanklistRenderer` parity work |
| Full-chain E2E harness | Done | Real bwcx/Koa app plus controlled mock RankLand backend |
| Migration process | Active | Slice workflow, conversation I/O protocol, and this dashboard are in `docs/migration` |

## Open Decisions

- Whether to prioritize SRK renderer wrapper parity before visual app shell parity.
- Whether live page product review should produce one broad polish slice or several small parity slices.
- Whether to introduce a fuller Vue app shell before or after route-level parity review.

## Known Risks

- Route foundations preserve core behavior but do not yet guarantee exact visual parity with old React/Ant Design pages.
- Live realtime behavior is covered by deterministic tests, but production WebSocket edge cases still need review.
- SRK renderer wrapper is shared by multiple migrated routes, so parity changes should be isolated and heavily tested.

## Next Slice Queue

1. Live product review and remaining parity gaps.
2. SRK renderer wrapper parity beyond foundation controls.
3. App shell/layout parity.
4. Page-specific polish from product review.
