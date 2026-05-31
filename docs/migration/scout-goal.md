# Codex Scout Goal — RankLand 迁移复刻 TODO 清单侦察

Created: 2026-05-31 11:59:37 +0800
Controller: Echo / Hermes

## Mission

Run the **first goal only** for RankLand migration restoration: produce a comprehensive, evidence-backed TODO/backlog for remaining migration-parity work between:

- old reference frontend: `/Users/cooper/Projects/RankLand/rankland-fe`
- new migration target: `/Users/cooper/Projects/RankLand/rankland-web`
- current branch: `migration/live-page-foundation`

This is a **Scout / audit goal**, not a build goal.

Your output will be used by a later, separate Builder goal. Therefore the most important deliverable is a clear, executable TODO list, not code changes.

## Hard boundaries

You MUST NOT fix product code in this goal.

Allowed changes:

- `docs/migration/parity-backlog.md`
- `docs/migration/scout-report-2026-05-31.md`
- `docs/migration/evidence/*.md`
- optionally this file only if you need to append a scout run note

Forbidden changes:

- `src/**`
- `tests/**`
- `package.json`, lockfiles, build config
- generated router outputs
- any production implementation file

If you discover a bug/difference, record it. Do not fix it.

## Primary deliverables

Create or update these files:

1. `docs/migration/parity-backlog.md`
   - the canonical TODO list for later Builder goal
   - include every actionable remaining parity item you can find with concrete evidence

2. `docs/migration/scout-report-2026-05-31.md`
   - short report summarizing scope audited, methods used, counts by status/priority/surface, and recommended first Builder batch

3. `docs/migration/evidence/PAR-XXX-*.md`
   - one evidence note per non-trivial TODO
   - use stable IDs such as `PAR-001`, `PAR-002`, etc.

## Backlog schema

Each backlog item must use this shape:

```md
### PAR-001 — <short title>

- status: discovered | ready | blocked | done | wontfix
- priority: P0 | P1 | P2
- surface: AppShell | Home | Search | Ranklist | Collection | Playground | Live | SRK | SSR | Routing | Analytics | Docs | Other
- risk: low | medium | high
- old reference: <file path / route / component / selector / fixture>
- new target: <file path / route / component / selector / fixture>
- difference: <specific DOM/class/visual/interaction/API/SSR difference>
- evidence: <link to docs/migration/evidence/PAR-XXX-*.md or inline snippet>
- suggested test: <unit/SSR/Playwright/manual check that can verify it>
- acceptance: <what Builder must make true>
- notes: <optional>
```

`ready` is allowed only if all are true:

- old/new comparison is concrete
- reproduction path is clear
- expected behavior is specific
- suggested test or acceptance path is executable
- risk is not high
- no product/design decision is required

Use `discovered` when evidence is promising but not enough for direct execution. Use `blocked` when human product judgment is needed.

## Audit scope

Perform a broad but disciplined pass over the remaining migration surface, biased toward user-visible parity and release-blocking polish:

1. Read existing migration docs first:
   - `docs/migration/status.md`
   - `docs/migration/manual-acceptance-checklist.md`
   - `docs/migration/final-integration-review.md`
   - `docs/migration/playbook.md`
   - relevant `docs/superpowers/specs/*migration*` and `docs/superpowers/plans/*migration*`

2. Compare old `rankland-fe` and new `rankland-web` for public routes and major surfaces:
   - App shell/header/footer/site switch
   - Home
   - Search
   - Ranklist detail / SRK renderer
   - Collection
   - Playground
   - Live
   - SSR/head/canonical/hydration-sensitive output
   - route compatibility and analytics/fallbacks where relevant

3. Prefer concrete checks:
   - source-level old/new component comparison
   - existing tests and snapshots
   - DOM/class/attribute comparison where possible
   - documented known caveats from migration status/review files
   - minimal local inspection commands that do not modify product code

4. Record already-done evidence only briefly. Do not duplicate the huge final review. Focus on actionable remaining TODOs and confidence gaps.

## What counts as a TODO

Include an item if it is one of:

- a concrete old/new parity difference
- an unverified but important parity risk with a clear verification plan
- a release acceptance gap
- a missing regression test for an important restored behavior
- a lower-level SRK/table/detail polish gap mentioned by existing docs

Do NOT include vague items like “make it look better” unless you can attach exact evidence and acceptance.

## Execution rules

- Do not start the second/Builder goal.
- Do not fix anything.
- Do not invent differences without source evidence.
- If you run tests or scripts, only use them to inspect/verify current state.
- Keep output compact enough that the next Builder goal can consume it directly.
- If no concrete remaining issue is found for a surface, mark that surface as `no high-confidence TODO found` in the scout report.

## Finalization

Before stopping:

1. Ensure only allowed docs files changed.
2. Run `git diff --check`.
3. If docs are coherent, create one docs-only commit:

```bash
git add docs/migration/scout-goal.md docs/migration/parity-backlog.md docs/migration/scout-report-2026-05-31.md docs/migration/evidence
git commit -m "docs: 生成迁移复刻待办清单"
```

4. Stop. Do not proceed to Builder execution.

## Final response shape inside Codex

End with a short summary containing:

- backlog path
- report path
- total TODO count by status and priority
- recommended first Builder batch
- whether docs-only commit was created
- any blocker that requires Cooper/Echo decision
