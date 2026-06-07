# Codex Scout/Review Goal — RankLand 迁移复刻剩余风险复核

Updated: 2026-05-31 18:56:47 +0800
Controller: Echo / Hermes

## Mission

Run a controlled **Scout/Review pass**, not a Builder pass, for the remaining non-ready migration backlog items after Batch `BLD-2026-05-31-02`.

Current repo:

- old reference frontend: `/Users/cooper/Projects/RankLand/rankland-fe`
- new migration target: `/Users/cooper/Projects/RankLand/rankland-web`
- branch: `migration/live-page-foundation`
- canonical backlog: `docs/migration/parity-backlog.md`

Current situation:

- `ready = 0`
- `PAR-006A/B/C` are done
- the next step is to turn remaining uncertainty into either `done`, `wontfix`, `blocked`, or concrete child `ready` tickets

This goal must preserve Cooper/Echo's control loop: Scout discovers and structures; Builder fixes later.

## Batch SRV-2026-05-31-01

Review only these backlog items:

1. `PAR-001 — SRK production fixture lower-level table pixel audit`
2. `PAR-003 — Playground real Monaco editing E2E gap`

## Hard boundaries

You MUST NOT fix product code in this goal.

Forbidden changes:

- `src/**`
- `tests/**`
- `package.json`, lockfiles, build config
- generated router outputs
- any production implementation file

Allowed committed changes:

- `docs/migration/scout-goal.md`
- `docs/migration/parity-backlog.md`
- `docs/migration/scout-review-report-2026-05-31.md`
- `docs/migration/evidence/PAR-001-*.md`
- `docs/migration/evidence/PAR-003-*.md`
- new `docs/migration/evidence/PAR-001A-*.md`, `PAR-001B-*.md`, `PAR-003A-*.md`, etc. if concrete child items are discovered
- `docs/migration/status.md` only if this review changes concrete migration status

Allowed uncommitted/generated evidence artifacts:

- screenshots or logs under `test-results/scout-review-2026-05-31/`

Do not commit generated screenshots unless the repository already tracks comparable artifacts and they are clearly intended to be committed. Prefer linking paths from evidence docs.

If you need to run local servers, tests, scripts, or Playwright, use them only to inspect current state. Do not modify implementation code or tests.

## PAR-001 review instructions

Goal: determine whether SRK lower-level rendering still has concrete old/new parity differences that warrant Builder work.

Review old/new SRK behavior across a small but meaningful fixture/case corpus. Focus on user-visible renderer details such as:

- dense tables and many problem columns
- long participant/team names
- medal/rank/marker presentation
- remarks or banners
- null/unknown statuses
- frozen/penalty/status edge cases if available
- modal/detail interactions if already supported by existing fixtures

Use existing project fixtures, existing full-chain tests, docs, screenshots, source comparison, or lightweight Playwright-assisted inspection. Do not invent new product requirements.

Outcome must be one of:

A. No concrete high-confidence lower-level SRK differences found:
   - mark `PAR-001` as `done`
   - update its evidence note with audited cases and limits

B. Concrete differences found:
   - keep `PAR-001` as parent/audit item, or mark it done as an audit if appropriate
   - create child tickets `PAR-001A`, `PAR-001B`, ...
   - mark a child as `ready` only when it has exact old/new evidence, route/fixture, selectors or DOM/CSS source, suggested verification, and no product/design decision needed
   - do not fix the child ticket

C. Evidence insufficient or tool/harness limitation blocks the audit:
   - leave `PAR-001` as `discovered` or mark `blocked` with a specific blocker and next manual step

## PAR-003 review instructions

Goal: decide whether the Playground real Monaco editing E2E gap is actionable, a harness limitation, or a product behavior issue.

Review:

- old `rankland-fe` Playground editing path and expectations
- new `rankland-web` Playground Monaco integration and preview sync
- existing E2E hook-based coverage and any documented hang around `editor.setValue()`
- whether a stable user-like edit path exists in the current harness without changing product/test files

Outcome must be one of:

A. A stable real Monaco editing E2E path is clearly feasible:
   - create `PAR-003A` as a `ready` test/harness ticket with exact steps, selectors/API, suggested test, and acceptance
   - do not implement the test

B. The gap is only a current harness limitation with existing product coverage acceptable:
   - mark `PAR-003` as `wontfix` or `blocked` as appropriate
   - document the manual check or reason in the evidence file

C. A real product behavior difference is discovered:
   - create a concrete child `ready` ticket with reproduction and acceptance
   - do not fix it

## Backlog status rules

`ready` is allowed only if all are true:

- old/new evidence is concrete
- reproduction path is clear
- expected behavior is specific
- suggested test or acceptance path is executable
- risk is not high
- no product/design decision is required

Use `discovered` for plausible but not yet directly executable work. Use `blocked` when human judgment or external setup is needed. Use `wontfix` only for explicitly accepted gaps or documented harness limitations that should not drive Builder work.

Keep status counts at the top of `docs/migration/parity-backlog.md` consistent with the items.

## Required deliverables

Before stopping, update/create:

1. `docs/migration/scout-review-report-2026-05-31.md`
   - scope audited
   - methods used
   - findings for PAR-001 and PAR-003
   - status changes
   - new child tickets, if any
   - recommended next action: Builder, another Scout, or Cooper/Echo decision

2. Relevant evidence files:
   - `docs/migration/evidence/PAR-001-srk-production-fixture-pixel-audit.md`
   - `docs/migration/evidence/PAR-003-playground-real-editor-e2e-gap.md`
   - child evidence files if child tickets are created

3. `docs/migration/parity-backlog.md`
   - status/count updates
   - child tickets if created
   - no stale recommendation that says to start already-completed PAR-006 work

## Verification and finalization

Before final response:

1. Ensure no forbidden files changed:

```bash
git status --short
```

2. Run:

```bash
git diff --check
```

3. If only allowed docs changed and they are coherent, create one docs-only commit:

```bash
git add docs/migration/scout-goal.md docs/migration/parity-backlog.md docs/migration/scout-review-report-2026-05-31.md docs/migration/evidence docs/migration/status.md
git commit -m "docs: 复核迁移复刻剩余风险"
```

If there are no substantive docs changes beyond this goal file, explain why and stop without inventing a commit.

## Final response shape inside Codex

End with a concise Chinese status panel:

- reviewed items
- final status of `PAR-001` and `PAR-003`
- any new child tickets and their status
- whether a docs-only commit was created
- verification run and result
- current worktree state
- recommended next action: Builder / another Scout / Cooper-Echo decision
- blockers requiring Cooper/Echo decision
