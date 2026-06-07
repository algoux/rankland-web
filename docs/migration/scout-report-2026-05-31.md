# RankLand 迁移复刻 Scout Report

Date: 2026-05-31
Branch: `migration/live-page-foundation`
Mode: docs-only Scout; no product code fixes.

## Scope Audited

- Existing migration docs: `status.md`, `manual-acceptance-checklist.md`, `final-integration-review.md`, `playbook.md`, `inventory.md`, `api-contract.md`.
- Relevant specs/plans under `docs/superpowers/specs` and `docs/superpowers/plans`, with emphasis on deferred, accepted, blocked, and product-review-driven language.
- Old React sources under `/Users/cooper/Projects/RankLand/rankland-fe/src/pages`, `/src/components`, `/src/layouts`, and `/src/utils`.
- New Vue/bwcx targets under `src/client`, `src/common/rankland-api`, and full-chain/unit test coverage under `tests/e2e/full-chain` and `tests/unit`.

## Methods Used

- Source-level old/new comparison for public routes and shared SRK/Playground/Live helpers.
- Documentation mining for accepted differences, known caveats, deferred decisions, and final gate evidence.
- Test inventory review for route/full-chain coverage and known harness skips or hooks.
- No product code changes and no runtime migration gates beyond static inspection commands.

## Backlog Summary

| status | count |
| --- | ---: |
| discovered | 3 |
| blocked | 2 |
| wontfix | 1 |

| priority | count |
| --- | ---: |
| P0 | 0 |
| P1 | 3 |
| P2 | 3 |

| surface | count |
| --- | ---: |
| SRK | 1 |
| Playground | 3 |
| Other | 2 |

## Surface Results

| Surface | Scout result |
| --- | --- |
| AppShell | no high-confidence TODO found; docs/tests cover legacy layout, header/nav/right-menu/site-switch, contact modal, analytics dispatch, theme/bootstrap, fallback 404, and viewport bounds. |
| Home | no high-confidence TODO found; docs/tests cover SSR content, legacy wrappers/classes, cards, links, statistics fallback, contact modal, SEO baseline, and desktop/mobile review. |
| Search | no high-confidence TODO found; docs/tests cover CSR list-all, route Head without canonical, whitespace/query serialization, Ant Design search/list states, DOM/class contracts, and error/empty states. |
| Ranklist | no route-level high-confidence TODO found; remaining shared risk is `PAR-001` for broader SRK production fixture pixel audit. |
| Collection | no high-confidence TODO found; docs/tests cover SSR/head, menu anchors/open keys, nav/collapse/mobile behavior, selected-ranklist states, and shared SRK rendering. |
| Playground | `PAR-002`, `PAR-003`, and `PAR-004` record the remaining accepted/blocked/harness-specific parity questions. |
| Live | no high-confidence TODO found; docs/tests cover CSR head, polling/WebSocket/reconnect, Toastify DOM/order/animation, scroll-solution toggle/reload/mobile behavior, and shared SRK rendering. |
| SRK | `PAR-001` remains as a confidence/audit item for production fixture lower-level table pixel parity. |
| SSR | no high-confidence TODO found; SSR-sensitive pages and head/canonical behavior are covered by final review and full-chain tests. |
| Routing | no high-confidence TODO found; public route inventory and generated route outputs are documented and tested. |
| Analytics | no high-confidence TODO found; local dispatch intent is covered while external Google requests stay denied in tests. |
| Docs/Release | `PAR-005` and `PAR-006` remain as closure/manual-decision work. |

## Recommended First Builder Batch

Start with `PAR-006` as a final old/new visual route review. If that review finds a concrete SRK table/detail difference, split it from `PAR-001` into the first implementation slice. Do not change Playground dependencies or mobile overflow behavior unless Cooper/Echo reopens `PAR-002` or `PAR-004`.

## Blockers / Decisions

- `PAR-002`: exact Monaco `0.34.x` parity is blocked on a dependency/product decision.
- `PAR-005`: release cutover, merge, deployment, and old implementation retirement are blocked on Cooper/Echo process decisions.
- `PAR-004`: mobile Playground old overflow behavior is currently `wontfix` under the no-horizontal-overflow product gate.

## Files Produced

- `docs/migration/parity-backlog.md`
- `docs/migration/evidence/PAR-001-srk-production-fixture-pixel-audit.md`
- `docs/migration/evidence/PAR-002-playground-monaco-version-decision.md`
- `docs/migration/evidence/PAR-003-playground-real-editor-e2e-gap.md`
- `docs/migration/evidence/PAR-004-playground-mobile-overflow-decision.md`
- `docs/migration/evidence/PAR-005-release-cutover-decision.md`
- `docs/migration/evidence/PAR-006-final-manual-route-visual-review.md`
