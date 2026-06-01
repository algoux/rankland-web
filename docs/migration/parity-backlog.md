# RankLand 迁移复刻 TODO Backlog

Generated: 2026-05-31
Scope: Scout-only audit of `rankland-fe` versus `rankland-web` on branch `migration/live-page-foundation`.

This backlog records remaining migration-parity work with evidence. It intentionally does not prescribe product-code fixes for accepted decisions or release-process items.

## Counts

| status | count |
| --- | ---: |
| ready | 0 |
| discovered | 0 |
| done | 4 |
| blocked | 2 |
| wontfix | 3 |

| priority | count |
| --- | ---: |
| P0 | 0 |
| P1 | 6 |
| P2 | 3 |

## Recommended Next Action

1. No Builder-ready migration parity item remains after Scout batch `SRV-2026-05-31-01` and the 2026-06-01 decision checkpoint.
2. `PAR-002` is closed as `wontfix`: exact old Monaco `0.34.x` package-version parity is intentionally not required while the Vue-compatible Monaco path remains product-green.
3. `PAR-003` is closed as `wontfix`: the current hook/unit coverage plus documented manual real-edit probe is accepted for migration closure; a future Monaco harness spike can be opened separately if needed.
4. `PAR-001` remains blocked unless a small production-like SRK corpus is approved. `PAR-005` remains blocked because release/cutover/deployment is an explicit process decision, not automatic Builder work.

## Items

### PAR-001 — SRK production fixture lower-level table pixel audit

- status: blocked
- priority: P1
- surface: SRK
- risk: medium
- old reference: `/Users/cooper/Projects/RankLand/rankland-fe/src/components/StyledRanklistRenderer.tsx`, `/Users/cooper/Projects/RankLand/rankland-fe/src/components/StyledRanklistRenderer.less`, production SRK fixtures
- new target: `src/client/components/rankland-ranklist.vue`, `tests/e2e/full-chain/ranklist.spec.ts`, `tests/e2e/full-chain/live.spec.ts`
- difference: current docs verify many wrapper/header/modal/table-adjacent details but explicitly do not claim every possible production SRK fixture has been pixel-reviewed against old React. Scout batch `SRV-2026-05-31-01` found no high-confidence concrete lower-level SRK mismatch in the existing repo fixtures, but the available fixture corpus is too small to close the audit.
- evidence: `docs/migration/evidence/PAR-001-srk-production-fixture-pixel-audit.md`
- suggested test: Playwright old/new screenshot and DOM/class comparison over a small production SRK fixture corpus covering dense tables, long names, many problems, medals/markers, remarks, banners, null statuses, frozen statuses, and modals.
- acceptance: either Cooper/Echo provides or approves a production-like SRK corpus and no concrete lower-level pixel differences are found, or each concrete difference is split into a child `ready` PAR with exact old/new selectors, screenshots, and a focused regression test.
- notes: blocked on corpus/visual evidence selection. This is not a license for broad SRK redesign. Keep any future Builder slice isolated to one concrete visual difference.

### PAR-002 — Playground Monaco exact package-version parity decision

- status: wontfix
- priority: P2
- surface: Playground
- risk: medium
- old reference: `/Users/cooper/Projects/RankLand/rankland-fe/package.json` (`monaco-editor` `^0.34.0`, `react-monaco-editor` `^0.50.1`)
- new target: `package.json`, `pnpm-lock.yaml`, `src/client/modules/playground/playground-monaco-loader.ts`
- difference: migrated Playground uses `@guolao/vue-monaco-editor@1.6.0` with `monaco-editor@0.43.0`; exact old Monaco `0.34.0` package parity is intentionally not preserved.
- evidence: `docs/migration/evidence/PAR-002-playground-monaco-version-decision.md`
- suggested test: package baseline unit test plus existing Playground full-chain Monaco readiness/minimap/theme tests, if Cooper chooses to revisit this decision.
- acceptance: exact package-version parity is not required for migration closure. The accepted contract is product-compatible Playground behavior on the current Vue-compatible Monaco stack, guarded by existing unit/full-chain coverage.
- notes: closed at the 2026-06-01 decision checkpoint. Revisit only as a separate dependency spike, not as migration Builder work.

### PAR-003 — Playground real Monaco editing E2E gap

- status: wontfix
- priority: P2
- surface: Playground
- risk: medium
- old reference: `/Users/cooper/Projects/RankLand/rankland-fe/src/components/SrkPlayground.tsx`
- new target: `src/client/modules/playground/playground.view.vue`, `src/client/modules/playground/playground-preview-sync.ts`, `tests/e2e/full-chain/playground.spec.ts`
- difference: product live preview sync is covered through shared preview-sync logic and a stable E2E hook, but full-chain tests still avoid synthetic Monaco editing because `editor.setValue()` hangs in the current Vite 2 harness. Scout batch `SRV-2026-05-31-01` found that a real keyboard edit can reach the invalid state, but a stable full-source valid replacement path was not proven in the current harness.
- evidence: `docs/migration/evidence/PAR-003-playground-real-editor-e2e-gap.md`
- suggested test: replace or supplement the E2E hook with a stable real Monaco edit path that types/pastes valid and invalid SRK JSON into the editor and observes preview/invalid state changes.
- acceptance: existing hook/unit coverage plus documented manual real-edit probe is sufficient for migration closure. A stable visible-Monaco edit E2E can be reopened as a future harness-quality spike, not a parity blocker.
- notes: closed as `wontfix` at the 2026-06-01 decision checkpoint because this is a harness confidence gap, not a high-confidence product behavior failure.

### PAR-004 — Playground mobile old overflow behavior decision

- status: wontfix
- priority: P2
- surface: Playground
- risk: low
- old reference: `/Users/cooper/Projects/RankLand/rankland-fe/src/components/SrkPlayground.tsx`, old `.srk-playground-container` / `.srk-playground-preview` layout
- new target: `src/client/modules/playground/playground.view.vue`, `tests/e2e/full-chain/playground.spec.ts`
- difference: old desktop fixed-width layout is preserved, but exact old mobile fixed-width overflow behavior is not; the migration keeps the current no-horizontal-overflow mobile guard.
- evidence: `docs/migration/evidence/PAR-004-playground-mobile-overflow-decision.md`
- suggested test: none for Builder unless Cooper reverses the decision. Existing full-chain mobile bounds/no-overflow checks are the accepted behavior.
- acceptance: keep `wontfix` while the product gate requires mobile no-horizontal-overflow. If reopened, define a concrete mobile viewport and expected old/new overflow contract before any code work.
- notes: current migration docs already treat this as an accepted product safety tradeoff.

### PAR-005 — Release cutover, branch merge, and old implementation retirement decision

- status: blocked
- priority: P1
- surface: Other
- risk: medium
- old reference: `/Users/cooper/Projects/RankLand/rankland-fe`, production deployment process
- new target: `rankland-web` branch `migration/live-page-foundation`, release/merge process
- difference: final migration review explicitly excludes production deployment, remote push, branch merge, and old implementation deletion; these are not product-code parity fixes but remain migration closure work.
- evidence: `docs/migration/evidence/PAR-005-release-cutover-decision.md`
- suggested test: release checklist that runs `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, deployment smoke checks, and rollback verification on the chosen target environment.
- acceptance: Cooper/Echo chooses the cutover path, target branch, deployment environment, old app retirement plan, and rollback criteria.
- notes: keep out of Builder product-code scope unless the next goal explicitly includes release operations.

### PAR-006 — Final manual old/new route visual review

- status: done
- priority: P1
- surface: Other
- risk: medium
- old reference: public routes in `/Users/cooper/Projects/RankLand/rankland-fe`: `/`, `/search`, `/ranklist/:id`, `/collection/:id`, `/playground`, `/live/:id`
- new target: matching `rankland-web` routes and full-chain screenshots under `tests/e2e/full-chain`
- difference: automated and documented parity evidence is broad, but the manual checklist still records route-level product polish as the next step if a new concrete visual difference is found.
- evidence: `docs/migration/evidence/PAR-006-final-manual-route-visual-review.md`
- suggested test: manual or Playwright-assisted old/new screenshot review at desktop `1440x900` and mobile `390x844`, plus focused DOM inspection for any observed mismatch.
- acceptance: every audited surface is either marked `no high-confidence TODO found` or produces a child `ready` PAR with concrete old/new selectors, reproduction path, screenshots, suggested test, and acceptance criteria.
- notes: Builder review on 2026-05-31 captured old/new screenshots for `/`, `/search`, `/ranklist/test-key?focus=yes`, `/collection/official?rankId=test-key`, `/playground`, and `/live/live-test-key?token=t0` at `1440x900` and `390x844`. It promoted `PAR-006B` and `PAR-006C` as ready follow-up fixes and completed `PAR-006A`.

### PAR-006A — App shell logo asset parity

- status: done
- priority: P1
- surface: AppShell
- risk: low
- old reference: `/Users/cooper/Projects/RankLand/rankland-fe/src/assets/logo.png`
- new target: `src/client/assets/logo.png`, `tests/unit/app-logo-asset.spec.ts`
- difference: old React renders the legacy `RL` RankLand logo asset, while the migrated Vue app rendered the newer orange algoUX-style mark in the shared header.
- evidence: `docs/migration/evidence/PAR-006A-app-logo-asset-parity.md`
- suggested test: unit baseline asserting `src/client/assets/logo.png` has the legacy old React SHA-256 and `128x128` PNG dimensions.
- acceptance: shared app header image uses the old `RL` RankLand asset while existing header sizing tests continue to enforce the 40px rendered logo image contract.
- notes: implemented in this Builder window with `tests/unit/app-logo-asset.spec.ts`.

### PAR-006B — Ant Design primary color visual parity

- status: done
- priority: P1
- surface: AppShell / Search / SRK
- risk: medium
- old reference: old React Ant Design 4 light primary controls in `/search`, `/ranklist/:id`, `/collection/:id`, and `/live/:id`
- new target: Ant Design Vue primary/search/radio/switch control styling in `src/client`
- difference: old React primary controls render orange (`#ff8104` family), while the migrated Vue app still shows Ant Design Vue default blue on visible route controls such as the Search button and active SRK filter buttons.
- evidence: `docs/migration/evidence/PAR-006B-ant-primary-color-parity.md`
- suggested test: focused full-chain assertions for `/search` Search button and shared SRK filter controls comparing computed primary background/border/text colors in light mode.
- acceptance: visible primary controls on reviewed routes use the old orange primary color family without regressing dark-mode documented primary colors or existing layout bounds.
- notes: implemented in Batch `BLD-2026-05-31-02` with a shared Ant Design Vue ConfigProvider token plus a small global primary button / checked radio style hook. Focused full-chain coverage verifies `/search` primary Search button light-mode orange, `/ranklist/test-key?focus=yes` checked marker filter light-mode orange, and existing ranklist dark-mode primary green.

### PAR-006C — Collection category logo size parity

- status: done
- priority: P1
- surface: Collection
- risk: low
- old reference: `/Users/cooper/Projects/RankLand/rankland-fe/src/pages/collection/[id].tsx` collection nav menu category icons
- new target: `src/client/modules/collection/collection.view.vue` and collection nav styles
- difference: old React collection category icons render as small menu icons; the migrated Vue collection nav displays oversized category logo images that overlap menu text and consume the left rail.
- evidence: `docs/migration/evidence/PAR-006C-collection-category-logo-size-parity.md`
- suggested test: focused collection full-chain assertion for category logo bounding boxes and menu title text overlap at desktop and mobile viewports.
- acceptance: ICPC/CCPC/category logo images render within the old menu icon footprint, menu labels remain readable, and existing collection collapse/open-key/bounds tests stay green.
- notes: implemented in Batch `BLD-2026-05-31-02` by making the existing Collection nav category icon size rules pierce Ant Design Vue Menu slot DOM with `:deep`. Focused full-chain coverage verifies ICPC/CCPC category images render at `32x32`, icon boxes remain within the old menu footprint, labels remain visible without overlap, and existing desktop/mobile collapse behavior remains green.
