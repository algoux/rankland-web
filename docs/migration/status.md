# RankLand Migration Status

This file is the quick global dashboard for the RankLand migration. Update it at the end of every verified slice or when a slice's state materially changes.

## Current Focus

- Active branch: `migration/live-page-foundation`
- Current slice: `/live/:id` parity follow-up
- Latest slice commit: `feat: 补齐榜单导出分享入口` (this commit)
- Last recorded full gate: `corepack pnpm test:migration` passed in `docs/superpowers/plans/2026-05-18-ranklist-export-share-parity.md`
- Next recommended focus: product review of remaining SRK wrapper gaps, especially user modal rank-time data or asset URL rewriting

## Route Progress

| Route | Render | Status | Branch / Slice | Coverage | Remaining parity / risk |
| --- | --- | --- | --- | --- | --- |
| `/` | SSR | Foundation verified | `migration/home-page-foundation` | SSR smoke, shallow E2E, full-chain E2E | Contact modal, full app shell/layout parity, broader SEO consistency |
| `/search` | CSR | Foundation verified | `migration/search-page-foundation` | Unit, generated route, full-chain E2E | Product polish after route parity review |
| `/ranklist/:id` | SSR | Foundation + shared wrapper parity follow-ups verified | `migration/live-page-foundation` | Unit, route, full-chain E2E | UserInfo rank-time chart, SRK asset URL rewriting, complex export converters |
| `/collection/:id` | SSR | Foundation verified | `migration/collection-page-foundation` | Unit, route, full-chain E2E | Exact menu/mobile/category icon parity |
| `/playground` | CSR | Foundation verified | `migration/playground-page-foundation` | Unit, route, full-chain E2E | Monaco/editor parity and UX polish |
| `/live/:id` | CSR | Foundation + parity follow-ups verified | `migration/live-page-foundation` | Unit, route, full-chain E2E | Product review, realtime edge cases, UserInfo rank-time chart, SRK asset URL rewriting, complex export converters |

## Infrastructure Progress

| Area | Status | Notes |
| --- | --- | --- |
| Node / package manager | Done | Node 24, pnpm 8 |
| RankLand API service | Done | Normal/CDN API adapters, cache behavior, error mapping |
| Route builders | Done | Public route builders and generated route coverage |
| SRK Vue wrapper | Foundation + live controls + modal clicks + basic export/share done | Remaining `StyledRanklistRenderer` parity includes rank-time chart, SRK asset URL rewriting, and converter-backed exports |
| Full-chain E2E harness | Done | Real bwcx/Koa app plus controlled mock RankLand backend |
| Migration process | Active | Slice workflow, conversation I/O protocol, and this dashboard are in `docs/migration` |

## Open Decisions

- Whether to prioritize remaining SRK renderer wrapper parity before visual app shell parity.
- Whether live page product review should produce one broad polish slice or several small parity slices.
- Whether to introduce a fuller Vue app shell before or after route-level parity review.
- Whether to add converter dependencies for Gym Ghost, VJudge Replay, and Excel exports or defer those formats.

## Known Risks

- Route foundations preserve core behavior but do not yet guarantee exact visual parity with old React/Ant Design pages.
- Live realtime behavior is covered by deterministic tests, but production WebSocket edge cases still need review.
- SRK renderer wrapper is shared by multiple migrated routes, so remaining parity changes should be isolated and heavily tested.
- Basic SRK JSON download and copy/share actions are migrated, but converter-backed export formats are currently disabled pending a dependency/API decision.

## Next Slice Queue

1. Live product review and remaining parity gaps.
2. SRK renderer wrapper rank-time user modal parity.
3. SRK asset URL rewriting parity.
4. Converter-backed export formats, if product priority justifies the dependency work.
5. App shell/layout parity.
6. Page-specific polish from product review.
