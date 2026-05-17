# RankLand Migration Playbook

## Purpose

This playbook is the operating model for migrating `rankland-fe` into `rankland-web`.

Use it when planning, implementing, reviewing, or handing off any migration slice. The goal is to keep migration work small, verifiable, and compatible with the public behavior of the old React app while moving the implementation into Vue 3 + bwcx + vite-ssr.

## Current Migration Shape

`rankland-web` is the migration target. `rankland-fe` is the source of public behavior.

The migration preserves:

- public route compatibility;
- SSR for SEO-sensitive pages;
- CSR for browser-only workflows;
- RankLand upstream API semantics;
- SRK rendering behavior;
- full-chain behavior through mock-backed E2E tests.

The canonical reference files are:

- `AGENTS.md` for repository working rules;
- `docs/migration/inventory.md` for route and source inventory;
- `docs/migration/api-contract.md` for upstream API behavior;
- `docs/superpowers/specs/*` for accepted designs;
- `docs/superpowers/plans/*` for implementation slices.

## Runtime Baseline

Use Node 24 and pnpm 8.

```bash
fnm use 24
node -v
corepack pnpm -v
corepack pnpm install --frozen-lockfile
```

`package.json` declares the expected runtime. Treat engine warnings as a signal that verification is not authoritative.

## Slice Workflow

1. Inspect the current branch and worktree.

```bash
git status --short --branch
git branch --verbose --no-abbrev
```

2. Read the relevant source and target references.

For page work, read the old `rankland-fe/src/pages/...` page, any reused source components/utilities, `docs/migration/inventory.md`, and the matching spec/plan if it exists.

For API, routing, SSR, or test harness work, read `docs/migration/api-contract.md` and the affected files under `src/common`, `src/client`, `src/server`, and `tests`.

3. Choose the smallest externally meaningful slice.

Prefer one of:

- route shell and RPO;
- shared helper or adapter;
- SSR data loading;
- renderer wrapper;
- error mapping;
- full-chain E2E coverage;
- page-specific polish needed for parity.

4. Write or update focused tests before implementation when behavior is new or risky.

Use unit tests for pure helpers, route builders, adapters, error mapping, and generated-route contracts. Use SSR smoke tests for rendering contracts. Use full-chain E2E for public route behavior that depends on API wiring, SSR, hydration, or mock backend calls.

5. Implement with existing project patterns.

Use Vue components, composables, common helpers, and bwcx route metadata. Do not embed React in Vue. Do not hand-edit generated route outputs under `src/client/router` or `src/common/router`; regenerate them with:

```bash
corepack pnpm run gen:client-router
```

6. Run the narrowest useful verification first, then widen.

Typical progression:

```bash
corepack pnpm test:unit
corepack pnpm run build
corepack pnpm test:ssr
corepack pnpm test:e2e
corepack pnpm test:e2e:full-chain
corepack pnpm test:migration
```

For documentation-only changes, inspect the diff and linked references; runtime gates are not required unless the doc changes commands, route contracts, or acceptance criteria.

7. Commit by completed slice.

Use Conventional Commits with Chinese descriptions, for example:

```text
feat: 迁移搜索页基础视图
test: 补充搜索页全链路覆盖
fix: 修复合集页查询参数清理
docs: 固化迁移维护流程
```

## Agent And Skill Strategy

Use the `rankland-migration` Codex skill for future RankLand migration sessions. The skill should direct Codex back to this playbook and the relevant specs rather than duplicating all project facts.

Use specialized skills only when they directly match the task:

- `superpowers:test-driven-development` for feature or bugfix implementation;
- `superpowers:systematic-debugging` for failing tests or unexpected behavior;
- `superpowers:writing-plans` for a new multi-step migration slice;
- `superpowers:verification-before-completion` before claiming a branch is complete;
- `storybloq` only if the project needs durable cross-session tickets, handoffs, or decisions beyond the existing docs.

Prefer subagents for migration execution and problem handling when the current platform and user request allow it. Use the main agent to keep the critical path, own final integration, and make architectural calls. Use subagents for bounded parallel work that can be reviewed independently.

Good splits are:

- explorer: compare old React behavior with the target Vue route;
- explorer: inspect current test harness and route generation constraints;
- worker: implement one disjoint page/helper slice;
- worker: add tests in a separate, non-overlapping file set;
- reviewer: check parity, test gaps, and generated-file boundaries.

Before dispatching workers, assign explicit ownership. Prefer file-set ownership over vague feature ownership. Do not run parallel workers that modify the same Vue page, generated route files, shared API service, package manifests, lockfiles, or broad config files at the same time. If a task needs one of those shared files, keep that edit in the main agent or serialize the workers.

Use explorers freely for read-only questions. Use workers only when their write set is narrow and non-overlapping. After each worker returns, inspect the diff before continuing and run the smallest verification that proves the integrated result.

## Spec Coding And Conversation Maintenance

Spec coding is the default migration style for non-trivial work. The spec is the design contract; the plan is the execution checklist; commits are the durable history.

Use this flow:

1. Create or update a design spec under `docs/superpowers/specs/YYYY-MM-DD-<slice>-design.md` before broad page migrations, cross-runtime changes, API behavior changes, route contract changes, or E2E harness changes.
2. Create or update an implementation plan under `docs/superpowers/plans/YYYY-MM-DD-<slice>.md` when the work spans multiple files, multiple test layers, or more than one commit.
3. Keep specs focused on decisions, tradeoffs, data flow, SSR/CSR behavior, error handling, test strategy, acceptance criteria, and known risks.
4. Keep plans executable: target files, ordered tasks, expected tests, generated-file steps, and commit boundaries.
5. Update the spec or plan when implementation reality changes. Do not rely on Codex conversation history as the only record of a decision.
6. At handoff, summarize branch, latest commit, completed slice, verification results, skipped gates, open risks, and next recommended slice in the conversation.

Codex conversations are working memory, not project memory. Preserve decisions that must survive the session in one of:

- `docs/migration/playbook.md` for process rules;
- `docs/migration/inventory.md` for route/source inventory;
- `docs/migration/api-contract.md` for upstream API assumptions;
- `docs/superpowers/specs/*` for design decisions;
- `docs/superpowers/plans/*` for execution plans;
- commit messages for completed durable changes.

Use `storybloq` only if this documentation set stops being enough, for example when migration work starts needing durable tickets, multi-session handoffs, decision logs, or state that does not fit cleanly into specs/plans.

## Long-Running Execution Model

Use slice-based execution as the default way to complete the whole migration.

One Codex conversation should usually own one meaningful migration slice, such as `home-page-foundation`, `search-page-foundation`, `playground-page-foundation`, or `live-page-foundation`. Inside a slice, continue the same conversation through exploration, spec, plan, implementation, debugging, verification, and commit. Context compaction is acceptable inside a slice because durable decisions live in specs, plans, migration docs, and commits.

After a slice is verified and committed, write a handoff block and start a fresh conversation for the next slice. Fresh conversations reduce drift from old debugging paths while still recovering project state from the repo.

Use this handoff shape:

```text
请使用 rankland-migration skill 继续 RankLand 迁移。

Repo: /Users/cooper/Projects/RankLand/rankland-web
当前分支: <branch>
最新 commit: <hash> <message>

已完成:
- <completed slice>
- <key behavior>
- <test coverage>

验证:
- <command>: <result>
- 跳过的 gate: <reason>

当前文档:
- docs/migration/playbook.md
- docs/migration/inventory.md
- docs/migration/api-contract.md
- docs/superpowers/specs/<current spec>
- docs/superpowers/plans/<current plan>

下一步建议:
- <next slice>
- <questions to confirm>
- <recommended subagent split>

请先检查 git 状态和最近 commit，再按 playbook 继续。
```

Do not use one indefinitely long conversation as the project memory. Do not rely on autonomous scheduled tasks to perform product migration without review. Scheduled tasks are for checks, reminders, and status synthesis.

## Codex Automation Strategy

Use Codex automations as a brief generator, not as the main migration driver.

Keep one recurring automation: daily pre-work migration brief.

- Schedule: daily before the normal migration work window.
- Workspace: `/Users/cooper/Projects/RankLand/rankland-web`.
- Task: read `docs/migration/playbook.md`, `inventory.md`, `api-contract.md`, recent commits, and open specs/plans; summarize current migration state and the recommended next slice.
- Purpose: make it easy to start a fresh conversation with accurate context.

Avoid scheduled automations that implement pages, rewrite specs, run expensive full gates, commit changes, or modify shared files without a human-triggered session. Those tasks require parity judgment and review.

## Maintenance Rules

- Keep `docs/migration/inventory.md` current when route scope changes.
- Keep `docs/migration/api-contract.md` current when upstream API assumptions change.
- Add a spec before broad page migrations or cross-runtime changes.
- Add a plan when execution spans multiple files or verification gates.
- Prefer migration equivalence before redesign.
- Keep E2E mock fixtures representative and deterministic.
- Confirm no full-chain E2E server processes remain after test runs when changing launcher code.
- Record current verification output in the final handoff, including skipped gates and Node version.

## Remaining Route Backlog

As of the search-page foundation branch, the migrated public route foundation includes:

- `/` as an SSR route;
- `/search` as a CSR route;
- `/ranklist/:id` as an SSR route;
- `/collection/:id` as an SSR route;
- shared RankLand API service, route builders, SRK renderer wrapper, client route generator isolation, fixtures, and full-chain E2E harness.

The likely next route slices are:

- `/playground`;
- `/live/:id`.

Update this section when a route reaches full-chain coverage.
