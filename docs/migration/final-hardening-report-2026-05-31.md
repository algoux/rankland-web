# Final Hardening Report — 2026-05-31

## Scope

Final hardening pass for RankLand migration branch `migration/live-page-foundation` after the controlled Scout/Builder migration-restoration loop.

This pass did not authorize or perform any new Builder implementation work. It verified the current checkpoint and summarizes remaining non-code decisions.

## Current Checkpoint

- Branch: `migration/live-page-foundation`
- Latest pre-hardening commit: `36eaa63 docs: 复核迁移复刻剩余风险`
- Working tree before gate: clean
- Node / pnpm used for gate: Node `v24.11.1`, pnpm `8.15.9`

## Final Gate Results

Run at: `2026-05-31 20:46:48 +0800`

Commands:

```bash
fnm exec --using 24 bash -lc 'set -euo pipefail
node -v
corepack pnpm -v
git diff --check
corepack pnpm run gen:client-router
corepack pnpm test:migration'
```

Results:

- `node -v`: `v24.11.1`
- `corepack pnpm -v`: `8.15.9`
- `git diff --check`: passed
- `corepack pnpm run gen:client-router`: passed, generated 6 client routes
- `corepack pnpm test:migration`: passed
  - build: passed
  - unit: 39 test files / 159 tests passed
  - SSR: 1 test passed
  - shallow Playwright E2E: 1 test passed
  - full-chain Playwright E2E: 61 passed / 1 skipped

Notes:

- A stale full-chain E2E helper process from the previous Scout probe (`node tests/e2e/support/start-full-chain-e2e.js`) was cleaned up before this final gate to avoid port/process interference.
- The build still prints known Vite/vite-ssr package-format and chunk-size warnings; these did not fail the migration gate.

## Migration Restoration Work Completed in This Control Loop

Key checkpoint commits:

- `9e63abf docs: 生成迁移复刻待办清单`
- `7246d66 fix: 还原应用 Logo 资产`
- `a271fd4 docs: 更新迁移复刻 Builder 批次目标`
- `f277466 fix: 还原 Ant Design 主色视觉表现`
- `19d9c5c fix: 还原集合分类图标尺寸`
- `42467d8 docs: 更新迁移复刻 Scout 复核目标`
- `36eaa63 docs: 复核迁移复刻剩余风险`

Restored concrete parity items:

- `PAR-006A` — App shell logo asset parity
- `PAR-006B` — Ant Design primary color visual parity
- `PAR-006C` — Collection category logo size parity

Review/audit completed:

- `PAR-006` — Final manual old/new route visual review
- `SRV-2026-05-31-01` — Remaining risk review for `PAR-001` and `PAR-003`

## Current Backlog State

From `docs/migration/parity-backlog.md` after Scout batch `SRV-2026-05-31-01`:

| status | count |
| --- | ---: |
| ready | 0 |
| discovered | 0 |
| done | 4 |
| blocked | 4 |
| wontfix | 1 |

There is no Builder-ready migration parity item at this checkpoint.

## Remaining Decisions / Blockers

These are not safe to hand to Builder until Cooper/Echo makes an explicit decision or provides missing inputs.

### `PAR-001` — SRK production fixture lower-level table pixel audit

Status: `blocked`

Scout did not find a concrete old/new SRK renderer mismatch in the available repo fixtures. The blocker is corpus coverage: current fixtures are useful smoke/demo cases but do not represent dense production tables, many problem columns, long names, frozen/penalty/status edge cases, or a production-like modal corpus.

Decision options:

1. Provide or approve a small production-like SRK corpus, then run another Scout review.
2. Accept the current fixture/test coverage as sufficient and close/mark the audit accordingly.

### `PAR-002` — Playground Monaco exact package-version parity decision

Status: `blocked`

The migration intentionally uses the Vue-compatible Monaco stack rather than exact old Monaco `0.34.x` package parity.

Decision options:

1. Keep current product-compatible Monaco integration.
2. Authorize a dedicated spike to prove or reject exact Monaco package-version parity.

### `PAR-003` — Playground real Monaco editing E2E gap

Status: `blocked`

Scout found that real keyboard editing can trigger invalid JSON state, but did not prove a stable full-source valid replacement path in the current full-chain harness. Existing hook/unit coverage still protects the shared preview-sync path.

Decision options:

1. Accept current hook/unit coverage plus documented manual check as sufficient and mark as `wontfix`.
2. Authorize a dedicated Monaco harness spike to design a stable real-edit E2E path.

### `PAR-005` — Release cutover, branch merge, and old implementation retirement decision

Status: `blocked`

This is release/process work rather than migration parity code work.

Decision options:

1. Choose cutover target branch/environment and rollback criteria.
2. Keep migration branch as a verified local checkpoint until release planning is explicit.

## Readiness Assessment

Engineering checkpoint status: **green for current migration branch**.

- Product/test gate is green.
- Working tree was clean immediately after the final verification gate; this report is the docs-only record of that checkpoint.
- There are no Builder-ready parity fixes left.
- Remaining work is decision/input driven: production SRK corpus, Monaco E2E harness policy, exact Monaco version policy, and release/cutover planning.

Recommended next action: **Cooper/Echo decision checkpoint**, not another automatic Builder run.
