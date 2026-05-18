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
- `docs/migration/status.md` for the current global migration dashboard;
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

## Conversation I/O Protocol

Use this protocol to make migration conversations predictable whether the user provides a full handoff or only writes "继续迁移".

### Accepted Inputs

The user may start or continue a migration session with one of:

- a full handoff block from the previous session;
- a short command such as `继续迁移`, `继续 RankLand 迁移`, or `下一步`;
- a targeted request such as `修复 CI`, `继续 /search`, `检查当前状态`;
- a review or planning request that should not change files until explicitly requested.

When input is short, recover state from the repo rather than asking for repeated context. Use the current branch, recent commits, `docs/migration/status.md`, migration docs, and open specs/plans as the source of truth.

### Session Intake

At the beginning of a migration work session:

1. Use the `rankland-migration` skill.
2. Inspect branch, worktree, and recent commits.
3. Read `AGENTS.md`, `docs/migration/status.md`, this playbook, `docs/migration/inventory.md`, `docs/migration/api-contract.md`, and relevant `docs/superpowers/specs` / `docs/superpowers/plans`.
4. Confirm Node 24 and pnpm 8 before running implementation gates.
5. Report a short intake summary before substantive edits:
   - current branch and dirty/clean state;
   - latest commit;
   - dashboard current focus and route progress;
   - inferred migration progress;
   - current slice or recommended next slice;
   - immediate risks or blockers;
   - proposed subagent split, if useful.

If the worktree is dirty, identify whether the changes are related to the requested slice. Do not overwrite or revert them. If the dirty state blocks safe work, report the blocker and ask for direction.

### Planning Output

For non-trivial migration slices, produce or update:

- a design spec under `docs/superpowers/specs`;
- an implementation plan under `docs/superpowers/plans`.

The plan should name file-set ownership when workers may be used. Do not dispatch parallel workers that touch the same Vue page, generated routes, shared API service, package manifests, lockfiles, or broad config files.

The planning response should include:

- selected slice and scope;
- non-goals;
- test strategy;
- expected verification gates;
- decisions needed from the user, if any.

When there are no blocking decisions, proceed with implementation instead of stopping at a proposal.

### Execution Output

While executing:

- keep Codex conversation as working memory only;
- persist durable decisions in specs, plans, migration docs, or commits;
- use focused tests before implementation when behavior is new or risky;
- run narrow verification before broad gates;
- commit coherent completed pieces with Conventional Commits in Chinese;
- request review before treating a major slice as complete.

If a test or gate fails, switch to systematic debugging: report the exact failing command, root cause once known, the fix, and the fresh verification result.

### Final Output

At the end of a session or slice, report:

- branch name and latest commit;
- completed scope and key files or docs changed;
- verification commands and results;
- skipped gates and why;
- Node and pnpm versions when gates were run;
- remaining risks and deferred parity;
- decisions needed from the user, if any;
- recommended next slice and why;
- whether the next step should continue in this conversation or start a fresh one;
- confirmation that `docs/migration/status.md` was updated, or why it was not;
- a ready-to-paste handoff block for the next conversation when the current slice is complete.

If the slice is not complete, do not produce a final handoff as if it were complete. Instead, report current status, failing or pending gates, uncommitted changes, and the exact next action to continue in the same conversation.

### Decision Handling

Only stop for user input when a decision cannot be recovered from repo context and a reasonable default would risk product behavior, route compatibility, or user changes. Good decision prompts are concrete:

- choose whether to preserve a legacy behavior or intentionally defer it;
- choose whether to split a broad slice;
- choose whether to commit a documentation-only checkpoint;
- choose whether to start a fresh conversation after a verified slice.

Do not ask for confirmation for routine playbook actions such as reading docs, running narrow tests, writing required specs/plans, or fixing a clear gate failure.

Use this handoff shape. The first line must make the conversation visually distinguishable in a chat list:

```text
【RankLand 迁移｜<slice name>｜<状态: 计划中/实现中/已验证/阻塞>｜<branch>】

请使用 rankland-migration skill 继续 RankLand 迁移。

Repo: /Users/cooper/Projects/RankLand/rankland-web
当前分支: <branch>
最新 commit: <hash> <message>

状态面板:
- 当前 slice: <slice>
- 状态: <planned/in progress/verified/blocked>
- 全局进度: <brief route/dashboard summary>
- 下一步: <next action>
- 需要决策: <none or concrete decisions>

已完成:
- <completed slice>
- <key behavior>
- <test coverage>

验证:
- <command>: <result>
- 跳过的 gate: <reason>

当前文档:
- docs/migration/status.md
- docs/migration/playbook.md
- docs/migration/inventory.md
- docs/migration/api-contract.md
- docs/superpowers/specs/<current spec>
- docs/superpowers/plans/<current plan>

下一步建议:
- <next slice>
- <questions to confirm>
- <recommended subagent split>

请先检查 git 状态、最近 commit 和 docs/migration/status.md，再按 playbook 继续。
```

Do not use one indefinitely long conversation as the project memory. Do not rely on autonomous scheduled tasks to perform product migration without review. Scheduled tasks are for checks, reminders, and status synthesis.

## Codex Automation Strategy

Use Codex automations as a brief generator, not as the main migration driver.

Keep one recurring automation: daily pre-work migration brief.

- Schedule: daily before the normal migration work window.
- Workspace: `/Users/cooper/Projects/RankLand/rankland-web`.
- Task: read `docs/migration/status.md`, `playbook.md`, `inventory.md`, `api-contract.md`, recent commits, and open specs/plans; summarize current migration state and the recommended next slice.
- Purpose: make it easy to start a fresh conversation with accurate context.

Avoid scheduled automations that implement pages, rewrite specs, run expensive full gates, commit changes, or modify shared files without a human-triggered session. Those tasks require parity judgment and review.

## Maintenance Rules

- Keep `docs/migration/inventory.md` current when route scope changes.
- Keep `docs/migration/status.md` current when a slice is verified, blocked, resumed, or changes the recommended next step.
- Keep `docs/migration/api-contract.md` current when upstream API assumptions change.
- Add a spec before broad page migrations or cross-runtime changes.
- Add a plan when execution spans multiple files or verification gates.
- Prefer migration equivalence before redesign.
- Keep E2E mock fixtures representative and deterministic.
- Confirm no full-chain E2E server processes remain after test runs when changing launcher code.
- Record current verification output in the final handoff, including skipped gates and Node version.

## Remaining Route Backlog

As of the live-page foundation branch, the migrated public route foundation includes:

- `/` as an SSR route;
- `/search` as a CSR route;
- `/ranklist/:id` as an SSR route;
- `/collection/:id` as an SSR route;
- `/playground` as a CSR route;
- `/live/:id` as a CSR route;
- shared RankLand API service, route builders, SRK renderer wrapper, client route generator isolation, fixtures, and full-chain E2E harness.

The likely next route slices are:

- scroll-solution visual parity and realtime event rendering polish;
- SRK renderer wrapper parity beyond the foundation table;
- page-specific parity gaps found during product review.

Update this section when a route reaches full-chain coverage.
