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

Use subagents only when the current platform and user request allow it. Good splits are:

- explorer: compare old React behavior with the target Vue route;
- explorer: inspect current test harness and route generation constraints;
- worker: implement one disjoint page/helper slice;
- worker: add tests in a separate, non-overlapping file set;
- reviewer: check parity, test gaps, and generated-file boundaries.

Avoid parallel workers touching the same Vue page, generated route files, or shared API service at the same time.

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

As of the collection-page foundation branch, the migrated public route foundation includes:

- `/ranklist/:id` as an SSR route;
- `/collection/:id` as an SSR route;
- shared RankLand API service, route builders, SRK renderer wrapper, fixtures, and full-chain E2E harness.

The likely next route slices are:

- `/` real RankLand home behavior;
- `/search`;
- `/playground`;
- `/live/:id`.

Update this section when a route reaches full-chain coverage.
