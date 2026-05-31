# Codex Builder Goal — RankLand 迁移复刻清单执行

Created: 2026-05-31 13:05:56 +0800
Controller: Echo / Hermes

## Mission

Run the **second goal** for RankLand migration restoration: consume the TODO backlog created by the Scout goal and move the migration toward closure in a controlled, auditable way.

Primary inputs:

- Backlog: `docs/migration/parity-backlog.md`
- Scout report: `docs/migration/scout-report-2026-05-31.md`
- Evidence notes: `docs/migration/evidence/PAR-*.md`
- Old reference frontend: `/Users/cooper/Projects/RankLand/rankland-fe`
- New migration target: `/Users/cooper/Projects/RankLand/rankland-web`
- Current branch: `migration/live-page-foundation`

Important: the Scout backlog currently has no direct `ready` implementation tickets. Therefore this Builder window starts by executing `PAR-006` as a Builder-adjacent verification batch: perform the final old/new route visual review and promote only concrete, reproducible differences into new child `ready` PAR items. If safe child `ready` items are produced, you may implement a small number of them in the same goal window under the limits below.

## Autopilot budget

Stop when any one condition is met:

- 120 minutes elapsed
- 5 tickets/review items completed or updated
- 20 commits created
- full gate fails and cannot be fixed with one focused retry
- a change would require product/design judgment
- a fix would touch broad architecture or unrelated surfaces
- worktree is dirty and you cannot explain/resolve it cleanly
- no safe ready implementation item remains

## Hard boundaries

Do not touch `PAR-002` (Monaco version), `PAR-004` (mobile old overflow), or `PAR-005` (release/cutover) unless this file is explicitly updated by Echo/Cooper. They are blocked/wontfix decision items.

Do not do broad redesign or opportunistic refactors. Do not fix issues outside the backlog. If you discover a new issue, record it as a child PAR item first.

Protect generated router files. Do not hand-edit generated route outputs under `src/client/router` or `src/common/router`.

## Allowed first batch

### Batch BLD-2026-05-31-01

1. Execute `PAR-006 — Final manual old/new route visual review`.
2. Compare old/new public routes:
   - `/`
   - `/search`
   - `/ranklist/:id` using existing deterministic test fixtures/routes where possible
   - `/collection/:id` or `/collection/official?rankId=test-key` where supported by existing tests
   - `/playground`
   - `/live/:id` using existing deterministic test fixture routes where possible
3. Review both desktop `1440x900` and mobile `390x844` where the project harness supports it.
4. Prefer existing Playwright/full-chain fixtures and existing screenshots/test helpers over inventing new infrastructure.
5. If you find a concrete mismatch, create a child backlog item such as `PAR-006A`, `PAR-006B`, etc. with:
   - status: `ready` if it has exact evidence and does not need product judgment
   - old/new URL or fixture
   - selectors/classes/DOM snippets and screenshot path if available
   - suggested focused regression test
   - acceptance criteria
6. If no concrete mismatches are found, mark `PAR-006` done and update its evidence note.

## Implementation rules for child ready items

Only after the review creates or identifies concrete `ready` items:

1. Claim the highest-priority safe `ready` item.
2. Add or update regression coverage first when feasible.
3. Implement the minimal parity fix.
4. Run the closest focused verification.
5. Commit the item with a Chinese Conventional Commit message.
6. Update `docs/migration/parity-backlog.md` and the relevant evidence file.
7. Continue only if the worktree is clean and budget remains.

Do not implement more than 3 child ready items in this window.

## Verification gates

At minimum before final stop:

```bash
git status --short --branch
git diff --check
corepack pnpm run gen:client-router
corepack pnpm test:migration
```

If the work is docs-only review with no production/test changes, you may still run `git diff --check`; run runtime gates only if safe and relevant. If runtime gates are skipped, state why explicitly.

For any product-code or test change, `gen:client-router`, `test:migration`, and `git diff --check` are required before the final checkpoint.

## Documentation updates

Update as appropriate:

- `docs/migration/parity-backlog.md`
- `docs/migration/evidence/PAR-006-final-manual-route-visual-review.md`
- new `docs/migration/evidence/PAR-006A-*.md` child evidence notes if mismatches are found
- `docs/migration/builder-report-2026-05-31.md`
- `docs/migration/status.md` only if a concrete migration status changes materially

## Commit policy

Create commits at clean checkpoints:

- docs-only review result: `docs: 完成迁移复刻视觉复核`
- concrete fix: `fix: <中文说明>`
- test-only coverage: `test: <中文说明>`

If no implementation is safe because no ready item exists, commit the docs-only review result and stop.

## Final response shape inside Codex

End with a concise status panel:

- completed items
- created/promoted child ready items
- implemented fixes, if any
- verification gates run and results
- commits created
- current worktree state
- recommended next Builder action
- blockers requiring Cooper/Echo decision
