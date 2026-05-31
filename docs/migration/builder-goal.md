# Codex Builder Goal — RankLand 迁移复刻清单执行

Updated: 2026-05-31 16:01:48 +0800
Controller: Echo / Hermes

## Mission

Run the next controlled **Builder batch** for RankLand migration restoration. Consume only `ready` tickets from the Scout/Builder backlog, implement minimal parity fixes, verify, commit, update migration docs, and stop at the budget/risk boundary.

Primary inputs:

- Backlog: `docs/migration/parity-backlog.md`
- Builder report: `docs/migration/builder-report-2026-05-31.md`
- Evidence notes:
  - `docs/migration/evidence/PAR-006B-ant-primary-color-parity.md`
  - `docs/migration/evidence/PAR-006C-collection-category-logo-size-parity.md`
- Old reference frontend: `/Users/cooper/Projects/RankLand/rankland-fe`
- New migration target: `/Users/cooper/Projects/RankLand/rankland-web`
- Current branch: `migration/live-page-foundation`

## Batch BLD-2026-05-31-02

This batch is intentionally narrow and queue-like.

Allowed ticket queue, in order:

1. `PAR-006B — Ant Design primary color visual parity`
2. `PAR-006C — Collection category logo size parity`

You must complete and commit `PAR-006B` before starting `PAR-006C`.

## Autopilot budget

Stop when any one condition is met:

- 90 minutes elapsed
- 2 tickets completed
- 10 commits created
- a required verification gate fails and cannot be fixed with one focused retry
- a change would require product/design judgment
- a fix would touch broad architecture or unrelated surfaces
- worktree is dirty and you cannot explain/resolve it cleanly
- no safe ready implementation item remains

## Hard boundaries

Do not implement or modify these items:

- `PAR-001` except for incidental evidence/status references if directly relevant
- `PAR-002` — blocked Monaco version decision
- `PAR-003` — discovered Playground real Monaco E2E gap
- `PAR-004` — wontfix mobile overflow decision
- `PAR-005` — blocked release/cutover decision

Do not discover-and-fix opportunistic issues. If a new issue is found, record it in backlog/evidence only and do not fix it in this batch unless Echo/Cooper explicitly authorizes a later batch.

Protect generated router files. Do not hand-edit generated route outputs under `src/client/router` or `src/common/router`.

## Ticket rules

For each allowed ticket:

1. Read its backlog row and evidence file.
2. Confirm the old reference behavior from old source, existing screenshots, or computed evidence before changing code.
3. Add or update the smallest feasible regression coverage first.
4. Implement the minimal parity fix.
5. Run a focused verification for that ticket.
6. Update:
   - `docs/migration/parity-backlog.md`
   - the relevant `docs/migration/evidence/PAR-006*.md`
   - `docs/migration/builder-report-2026-05-31.md`
   - `docs/migration/status.md` only if it already tracks this concrete status
7. Commit the ticket independently with a Chinese Conventional Commit message.
8. Continue to the next ticket only if the commit is clean, verification is green, scope stayed narrow, and budget remains.

## PAR-006B specific guardrails

- First locate the old orange primary color source and the new Ant Design Vue primary styling source. Do not choose a color by visual guess alone.
- Prefer Ant Design Vue theme tokens, CSS variables, or a small global style hook over rewriting individual components.
- Acceptance: visible light-mode primary controls on reviewed routes use the old RankLand orange primary color family.
- Existing documented dark-mode primary behavior must remain green.
- Stop if the fix requires broad component rewrites or a design/product decision.

Suggested focused coverage:

- `/search`: computed color assertions for `.ant-input-search-button.ant-btn-primary`.
- `/ranklist/test-key?focus=yes`: computed color/border assertions for checked marker filter controls.
- Optionally reuse the shared SRK assertion on `/collection/official?rankId=test-key` or `/live/live-test-key?token=t0` if the theme hook is global.

## PAR-006C specific guardrails

- Keep the fix isolated to Collection nav category icon presentation.
- Do not restructure Collection data loading, routing, or menu state logic.
- Acceptance: category logos render at the old small menu-icon scale; ICPC/CCPC/category labels remain readable; collapse/open-key/mobile behavior remains unchanged.
- Stop if the fix requires a Collection menu architecture rewrite.

Suggested focused coverage:

- Extend `tests/e2e/full-chain/collection.spec.ts` or the closest existing collection full-chain helper to assert category logo bounding boxes and no label overlap on desktop and mobile.

## Required final verification gates

For any product-code or test change, before final stop run:

```bash
git diff --check
corepack pnpm run gen:client-router
corepack pnpm test:migration
```

Also run focused tests while implementing each ticket when practical.

## Commit policy

Create clean commits at ticket boundaries:

- `fix: 还原 Ant Design 主色视觉表现`
- `fix: 还原集合分类图标尺寸`

If you choose a different message, keep it Conventional Commit style and semantically precise.

## Final response shape inside Codex

End with a concise Chinese status panel:

- completed tickets
- skipped tickets and why
- implemented fixes
- verification gates run and results
- commits created
- current worktree state
- recommended next action: Builder, Scout/Review, or decision by Cooper/Echo
- blockers requiring Cooper/Echo decision
