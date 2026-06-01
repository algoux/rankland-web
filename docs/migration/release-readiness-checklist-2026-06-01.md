# RankLand Migration Release Readiness Checklist — 2026-06-01

## Scope

This document records a local release-candidate readiness checkpoint for branch `migration/live-page-foundation` after the controlled Scout → Builder migration parity loop.

It does **not** perform remote push, PR creation, production deployment, branch merge, DNS/CDN changes, database changes, or old `rankland-fe` retirement. Those remain explicit release operations under `PAR-005`.

## Current Local Decision State

- `PAR-006`, `PAR-006A`, `PAR-006B`, `PAR-006C`: done.
- `PAR-002`: closed as `wontfix`; exact old Monaco `0.34.x` package-version parity is not required for migration closure while product-compatible Playground behavior remains green.
- `PAR-003`: closed as `wontfix`; existing hook/unit coverage plus documented manual real-edit probe is accepted for migration closure. A future real-Monaco E2E harness spike can be opened separately.
- `PAR-001`: remains blocked on a small production-like SRK corpus if Cooper wants a lower-level table pixel audit beyond the current fixture/test corpus.
- `PAR-005`: remains blocked on release/cutover/rollback decision.

## Release Candidate Gate

Run from `/Users/cooper/Projects/RankLand/rankland-web`:

```bash
fnm exec --using 24 bash -lc 'set -euo pipefail
node -v
corepack pnpm -v
git diff --check
corepack pnpm run gen:client-router
corepack pnpm test:migration
git status --short --branch'
```

### Result

Run at: `2026-06-01 09:24-09:26 +0800`

- `node -v`: `v24.11.1`
- `corepack pnpm -v`: `8.15.9`
- `git diff --check`: passed
- `corepack pnpm run gen:client-router`: passed, generated 6 client routes
- `corepack pnpm test:migration`: passed
  - build: passed
  - unit: 39 test files / 159 tests passed
  - SSR: 1 smoke test passed
  - shallow Playwright E2E: 1 test passed
  - full-chain Playwright E2E: 61 passed / 1 skipped

Notes:

- `gen:client-router` still prints the known unsupported-language skip for `src/client/modules/fallback/not-found.view.vue`; it still generates the expected 6 client routes.
- The build still prints known Vite/vite-ssr package-format and chunk-size warnings; these did not fail the gate.
- After the gate, the only working-tree changes were the migration readiness docs/backlog updates for this checkpoint.

## Human Cutover Checklist

Before any merge/deploy, choose and record:

1. Target branch / PR strategy.
2. Deployment target and environment variables.
3. Production smoke URL set:
   - `/`
   - `/search`
   - `/ranklist/<known-production-id>`
   - `/collection/<known-collection-id>?rankId=<known-ranklist-id>`
   - `/playground`
   - `/live/<known-live-id>` if live data source is available.
4. Rollback criteria and rollback command/path.
5. Whether old `rankland-fe` remains as reference, is archived, or is removed from active deployment.
6. Whether a production-like SRK corpus should be copied/sanitized for `PAR-001` before or after cutover.

## Recommended Safe Next Step

Treat this branch as a local release candidate after the gate passes. The next unsafe action is not more Builder work; it is an explicit `PAR-005` release decision: PR/merge/deploy/rollback plan.

## Non-Goals

- Do not downgrade Monaco just to match old package versions.
- Do not add a broad flaky Monaco visible-editor E2E in the migration branch without a focused harness spike.
- Do not run another open-ended Builder goal while `ready = 0`.
- Do not remove or archive `rankland-fe` automatically.
