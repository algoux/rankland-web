# RankLand 迁移复刻 TODO Backlog

Generated: 2026-05-31
Scope: Scout-only audit of `rankland-fe` versus `rankland-web` on branch `migration/live-page-foundation`.

This backlog records remaining migration-parity work with evidence. It intentionally does not prescribe product-code fixes for accepted decisions or release-process items.

## Counts

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

## Recommended First Builder Batch

1. Start with `PAR-006` and complete one final manual old/new route visual review pass. Convert only newly observed concrete differences into new `ready` PAR items.
2. If SRK table/detail differences are observed during that review, run `PAR-001` as the first implementation-oriented batch because SRK is shared by `/ranklist/:id`, `/collection/:id`, `/playground`, and `/live/:id`.
3. Do not start `PAR-002`, `PAR-004`, or `PAR-005` until Cooper/Echo chooses whether those accepted differences or release actions are in scope for a Builder goal.

## Items

### PAR-001 — SRK production fixture lower-level table pixel audit

- status: discovered
- priority: P1
- surface: SRK
- risk: medium
- old reference: `/Users/cooper/Projects/RankLand/rankland-fe/src/components/StyledRanklistRenderer.tsx`, `/Users/cooper/Projects/RankLand/rankland-fe/src/components/StyledRanklistRenderer.less`, production SRK fixtures
- new target: `src/client/components/rankland-ranklist.vue`, `tests/e2e/full-chain/ranklist.spec.ts`, `tests/e2e/full-chain/live.spec.ts`
- difference: current docs verify many wrapper/header/modal/table-adjacent details but explicitly do not claim every possible production SRK fixture has been pixel-reviewed against old React.
- evidence: `docs/migration/evidence/PAR-001-srk-production-fixture-pixel-audit.md`
- suggested test: Playwright old/new screenshot and DOM/class comparison over a small production SRK fixture corpus covering dense tables, long names, many problems, medals/markers, remarks, banners, null statuses, frozen statuses, and modals.
- acceptance: either no concrete lower-level SRK pixel differences are found and this item is marked done, or each concrete difference is split into a child `ready` PAR with exact old/new selectors, screenshots, and a focused regression test.
- notes: this is not a license for broad SRK redesign. Keep any Builder slice isolated to one concrete visual difference.

### PAR-002 — Playground Monaco exact package-version parity decision

- status: blocked
- priority: P2
- surface: Playground
- risk: medium
- old reference: `/Users/cooper/Projects/RankLand/rankland-fe/package.json` (`monaco-editor` `^0.34.0`, `react-monaco-editor` `^0.50.1`)
- new target: `package.json`, `pnpm-lock.yaml`, `src/client/modules/playground/playground-monaco-loader.ts`
- difference: migrated Playground uses `@guolao/vue-monaco-editor@1.6.0` with `monaco-editor@0.43.0`; exact old Monaco `0.34.0` package parity is intentionally not preserved.
- evidence: `docs/migration/evidence/PAR-002-playground-monaco-version-decision.md`
- suggested test: package baseline unit test plus existing Playground full-chain Monaco readiness/minimap/theme tests, if Cooper chooses to revisit this decision.
- acceptance: Cooper/Echo either marks exact Monaco version parity `wontfix`, or authorizes a Builder spike to prove a stable Vue-compatible Monaco `0.34.x` integration without regressing current Playground behavior.
- notes: current docs accept the migrated editor as product-compatible; this remains blocked on product/dependency judgment.

### PAR-003 — Playground real Monaco editing E2E gap

- status: discovered
- priority: P2
- surface: Playground
- risk: medium
- old reference: `/Users/cooper/Projects/RankLand/rankland-fe/src/components/SrkPlayground.tsx`
- new target: `src/client/modules/playground/playground.view.vue`, `src/client/modules/playground/playground-preview-sync.ts`, `tests/e2e/full-chain/playground.spec.ts`
- difference: product live preview sync is covered through shared preview-sync logic and a stable E2E hook, but full-chain tests still avoid synthetic Monaco editing because `editor.setValue()` hangs in the current Vite 2 harness.
- evidence: `docs/migration/evidence/PAR-003-playground-real-editor-e2e-gap.md`
- suggested test: replace or supplement the E2E hook with a stable real Monaco edit path that types/pastes valid and invalid SRK JSON into the editor and observes preview/invalid state changes.
- acceptance: full-chain coverage exercises the real editor interaction path without the private `window.__ranklandPreviewPlaygroundSource` hook, or the harness limitation is explicitly marked `wontfix` with a documented manual check.
- notes: this is a test/harness parity gap, not currently proven product behavior failure.

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

- status: discovered
- priority: P1
- surface: Other
- risk: medium
- old reference: public routes in `/Users/cooper/Projects/RankLand/rankland-fe`: `/`, `/search`, `/ranklist/:id`, `/collection/:id`, `/playground`, `/live/:id`
- new target: matching `rankland-web` routes and full-chain screenshots under `tests/e2e/full-chain`
- difference: automated and documented parity evidence is broad, but the manual checklist still records route-level product polish as the next step if a new concrete visual difference is found.
- evidence: `docs/migration/evidence/PAR-006-final-manual-route-visual-review.md`
- suggested test: manual or Playwright-assisted old/new screenshot review at desktop `1440x900` and mobile `390x844`, plus focused DOM inspection for any observed mismatch.
- acceptance: every audited surface is either marked `no high-confidence TODO found` or produces a child `ready` PAR with concrete old/new selectors, reproduction path, screenshots, suggested test, and acceptance criteria.
- notes: this is the recommended first Builder-adjacent batch because it decides whether there are any real route-polish fixes left.
