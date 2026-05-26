# RankLand Migration Status

This file is the quick global dashboard for the RankLand migration. Update it at the end of every verified slice or when a slice's state materially changes.

## Current Focus

- Active branch: `migration/live-page-foundation`
- Current slice: SRK renderer wrapper visual parity
- Latest slice commit: `feat: 收口榜单渲染器视觉一致性` (this commit)
- Last recorded full gate: `corepack pnpm test:migration` passed build, 27 unit files / 130 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 38 full-chain Playwright tests across all migrated public routes during 2026-05-26 SRK wrapper visual parity pre-commit verification
- Next recommended focus: Home SEO/content polish or Live Toastify animation parity

## Route Progress

| Route | Render | Status | Branch / Slice | Coverage | Remaining parity / risk |
| --- | --- | --- | --- | --- | --- |
| `/` | SSR | Foundation + app shell + Ant Design Vue shell product parity + contact modal + analytics parity + visual review + completion audit verified | `migration/live-page-foundation` | SSR smoke, shallow E2E, full-chain E2E, app shell/theme/bootstrap/analytics full-chain E2E, Ant Design Vue shell DOM coverage, app shell desktop/mobile screenshot review, contact modal full-chain E2E, home desktop/mobile screenshot review, `test:migration` | Broader SEO consistency remains product polish |
| `/search` | CSR | Foundation + visual review + completion audit verified | `migration/live-page-foundation` | Unit, generated route, full-chain E2E, search desktop/mobile screenshot review, `test:migration` | Product polish after route parity review |
| `/ranklist/:id` | SSR | Foundation + shared wrapper header metadata/hover dropdown parity + visual review + completion audit verified | `migration/live-page-foundation` | Unit, route, full-chain E2E including view count, contributors, reference links, hover export/share dropdown open-close, footer contact modal, ranklist desktop/mobile screenshot review, `test:migration` | Product polish after route parity review |
| `/collection/:id` | SSR | Foundation + Ant Design Vue menu/category icon/mobile collapse product parity + selected-ranklist shared wrapper parity + visual review + completion audit verified | `migration/live-page-foundation` | Unit, route, full-chain E2E, Ant Design Vue menu/category icon/mobile collapse coverage, selected-ranklist wrapper header/filter/progress/footer/action coverage, collection desktop/mobile screenshot review, `test:migration` | Exact remaining-height calculation and pixel animation parity remain product polish |
| `/playground` | CSR | Foundation + Ant Design Vue welcome modal/action + Monaco editor/schema/theme/remaining-height product parity + visual review + completion audit verified | `migration/live-page-foundation` | Unit, route, full-chain E2E, one-time welcome modal/localStorage coverage, Monaco readiness/schema/theme coverage, playground desktop/mobile screenshot review, `test:migration` | Exact old Monaco `0.34.0` package-version parity and synthetic Monaco editing in Playwright remain deferred risk; product editor path is verified by hydration/build and stable preview coverage |
| `/live/:id` | CSR | Foundation + parity follow-ups + reconnect/backoff + visual review + completion audit verified | `migration/live-page-foundation` | Unit, route, full-chain E2E including NotFound, WebSocket error reconnect, unexpected WebSocket close reconnect, scroll-solution toggle close, mobile toggle visibility, hidden internal status marker, desktop/mobile realtime layout bounds, normal live desktop/mobile screenshot review, mobile progress label bounds, and `test:migration` | Exact Toastify animation/pixel parity remains a deferred product enhancement |

## Infrastructure Progress

| Area | Status | Notes |
| --- | --- | --- |
| Node / package manager | Done | Node 24, pnpm 8 |
| RankLand API service | Done | Normal/CDN API adapters, cache behavior, error mapping |
| Route builders | Done | Public route builders and generated route coverage. `corepack pnpm run gen:client-router` now exits after one-shot generation; `gen:client-router:watch` preserves dev-time watch mode. |
| SRK Vue wrapper | Foundation + live controls + modal clicks + rank-time user modal + asset URL rewriting + basic export/share + converter-backed exports + footer contact prompt + header metadata + Ant Design Vue hover dropdowns + collection selected-wrapper controls done | Remaining exact table pixel and rank-time chart parity is product/visual review driven |
| Full-chain E2E harness | Done | Real bwcx/Koa app plus controlled mock RankLand backend |
| Vue app shell | Foundation + Ant Design Vue product parity + contact modal + theme sync + analytics + visual review verified | Logo, primary navigation, site switch dropdown, BackTop, legacy focus-mode shell bypass, shared contact modal, pre-hydration theme bootstrap, system theme class sync, macOS Blink optimization class, GA initialization/pageview dispatch, desktop/mobile viewport bounds, and screenshot review are covered by full-chain E2E. Ant Design Vue `a-menu` is mounted client-only to avoid its ResizeObserver SSR hydration mismatch. |
| Migration process | Final review verified | Slice workflow, conversation I/O protocol, this dashboard, completion audit, and final integration review are in `docs/migration` and `docs/superpowers` |

## Deferred Product Decisions

- Home: broader SEO/content polish beyond the verified structured-data and SSR smoke coverage remains product polish.
- Collection: exact remaining-height calculation and pixel animation parity remain product polish.
- Playground: one-time welcome modal, Ant Design Vue preview action, Monaco editor, SRK schema diagnostics, theme-aware editor theme, and remaining-height behavior are restored. Exact old Monaco `0.34.0` package-version parity is intentionally not preserved because the verified Vue wrapper requires Monaco `>=0.43.0`.
- Live: automatic WebSocket reconnect/backoff is restored as a product enhancement; exact Toastify animation/pixel behavior remains deferred.
- SRK renderer wrapper: header metadata, contributors, contest reference links, Ant Design Vue hover export/share dropdowns, and collection selected-ranklist wrapper controls are restored. Remaining exact table pixel and rank-time chart parity should be handled by product-review-driven slices.

## Known Risks

- Route foundations preserve core route compatibility and audited full-chain behavior, but do not claim pixel-perfect parity with old React/Ant Design pages.
- Vue app shell now preserves the legacy chrome with Ant Design Vue Layout/Menu/Dropdown/Button/BackTop, focus-mode bypass, contact modal, pre-hydration theme bootstrap, system theme class sync, macOS Blink optimization class, GA initialization/pageview dispatch, and desktop/mobile viewport bounds. The Ant Design Vue Menu is intentionally client-only because its ResizeObserver overflow wrapper causes SSR/client hydration node mismatches when rendered server-side. Analytics uses a lightweight local gtag adapter instead of `react-ga4`; full-chain E2E verifies dispatch intent through an E2E-only probe while external Google requests remain denied.
- Collection navigation now uses Ant Design Vue inline Menu, category logo assets, persisted collapse state, and mobile selected-ranklist collapse behavior. The Ant Design Vue Menu is intentionally client-only because its ResizeObserver overflow wrapper also causes SSR/client hydration node mismatches in inline mode.
- Playground now restores the old one-time welcome modal keyed by `PlaygroundWelcomeMessageRead`, uses Ant Design Vue Button/Tag/Modal for the visible editor action and shortcut cue, mounts a client-side Monaco JSON editor through `@guolao/vue-monaco-editor@1.6.0` and `monaco-editor@0.43.0`, serves `/monaco-editor/vs` locally from Koa, configures SRK schema diagnostics, syncs dark/light Monaco theme, and keeps loader configuration out of SSR import side effects. Synthetic Monaco editing through Playwright and synchronous `editor.setValue()` both hang in the current Vite 2 full-chain harness, so invalid/render-error states use an E2E-only preview hook while the product path uses Monaco `@change`, Preview, and `Ctrl/Cmd + S`.
- Live realtime behavior has deterministic success, NotFound, WebSocket error reconnect, unexpected WebSocket close reconnect, scroll-solution toggle close without reconnect, mobile toggle visibility, hidden internal status marker, desktop/mobile realtime layout bounds, normal live desktop/mobile page review, and mobile progress label bounds coverage. Reconnect uses bounded exponential backoff at 1000 ms, 2000 ms, 4000 ms, 8000 ms, then 10000 ms. Exact React Toastify animation/pixel parity remains intentionally deferred as a product enhancement.
- SRK renderer wrapper is shared by multiple migrated routes. This slice adds deterministic contributor/ref-link fixture coverage and route-level full-chain tests across ranklist, collection, live, and playground; remaining parity changes should stay isolated and heavily tested.
- Converter-backed SRK exports use lazy browser imports of `@algoux/standard-ranklist-convert-to@0.2.2`; `xlsx@0.18.5` remains a large but click-loaded dependency.
- User modal rank-time parity uses a lightweight Vue/SVG curve instead of the old React `@antv/g2` chart, so exact tooltip and animation parity remains intentionally deferred.

## Next Slice Queue

1. Home SEO/content polish beyond verified structured data and SSR smoke coverage.
2. Live product parity: exact Toastify animation/pixel behavior.
3. Rank-time parity: old `@antv/g2` tooltip and animation behavior, if product review requires exact chart parity.
