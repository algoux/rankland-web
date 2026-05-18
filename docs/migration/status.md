# RankLand Migration Status

This file is the quick global dashboard for the RankLand migration. Update it at the end of every verified slice or when a slice's state materially changes.

## Current Focus

- Active branch: `migration/live-page-foundation`
- Current slice: converter-backed exports dependency/API decision
- Latest slice commit: `docs: 固化 converter-backed 导出迁移决策` (this commit)
- Last recorded full gate: `corepack pnpm test:migration` passed in `docs/superpowers/plans/2026-05-18-srk-asset-url-rewrite-parity.md`; converter decision slice is documentation-only
- Next recommended focus: implement converter-backed exports from `docs/superpowers/plans/2026-05-19-converter-backed-exports.md`, or continue live product review if export formats are lower priority

## Route Progress

| Route | Render | Status | Branch / Slice | Coverage | Remaining parity / risk |
| --- | --- | --- | --- | --- | --- |
| `/` | SSR | Foundation verified | `migration/home-page-foundation` | SSR smoke, shallow E2E, full-chain E2E | Contact modal, full app shell/layout parity, broader SEO consistency |
| `/search` | CSR | Foundation verified | `migration/search-page-foundation` | Unit, generated route, full-chain E2E | Product polish after route parity review |
| `/ranklist/:id` | SSR | Foundation + shared wrapper parity follow-ups verified | `migration/live-page-foundation` | Unit, route, full-chain E2E | Complex export converters |
| `/collection/:id` | SSR | Foundation verified | `migration/collection-page-foundation` | Unit, route, full-chain E2E | Exact menu/mobile/category icon parity |
| `/playground` | CSR | Foundation verified | `migration/playground-page-foundation` | Unit, route, full-chain E2E | Monaco/editor parity and UX polish |
| `/live/:id` | CSR | Foundation + parity follow-ups verified | `migration/live-page-foundation` | Unit, route, full-chain E2E | Product review, realtime edge cases, complex export converters |

## Infrastructure Progress

| Area | Status | Notes |
| --- | --- | --- |
| Node / package manager | Done | Node 24, pnpm 8 |
| RankLand API service | Done | Normal/CDN API adapters, cache behavior, error mapping |
| Route builders | Done | Public route builders and generated route coverage |
| SRK Vue wrapper | Foundation + live controls + modal clicks + rank-time user modal + asset URL rewriting + basic export/share done | Remaining `StyledRanklistRenderer` parity includes converter-backed exports |
| Full-chain E2E harness | Done | Real bwcx/Koa app plus controlled mock RankLand backend |
| Migration process | Active | Slice workflow, conversation I/O protocol, and this dashboard are in `docs/migration` |

## Open Decisions

- Whether to prioritize remaining SRK renderer wrapper parity before visual app shell parity.
- Whether live page product review should produce one broad polish slice or several small parity slices.
- Whether to introduce a fuller Vue app shell before or after route-level parity review.
- Whether to schedule the converter-backed export implementation slice now. The dependency/API decision recommends adding `@algoux/standard-ranklist-convert-to@0.2.2` lazily from browser click handlers.

## Known Risks

- Route foundations preserve core behavior but do not yet guarantee exact visual parity with old React/Ant Design pages.
- Live realtime behavior is covered by deterministic tests, but production WebSocket edge cases still need review.
- SRK renderer wrapper is shared by multiple migrated routes, so remaining parity changes should be isolated and heavily tested.
- Basic SRK JSON download and copy/share actions are migrated, but converter-backed export formats are currently disabled pending implementation. The dependency/API decision is documented in `docs/superpowers/specs/2026-05-19-converter-backed-exports-decision-design.md`.
- User modal rank-time parity uses a lightweight Vue/SVG curve instead of the old React `@antv/g2` chart, so exact tooltip and animation parity remains intentionally deferred.

## Next Slice Queue

1. Live product review and remaining parity gaps.
2. Converter-backed export formats, using lazy `@algoux/standard-ranklist-convert-to@0.2.2` if product priority justifies the dependency work.
3. App shell/layout parity.
4. Page-specific polish from product review.
