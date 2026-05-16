# RankLand Migration After Node 24 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define the continuation workflow for visible RankLand page migration after the Node 24 LTS branch is verified.

**Architecture:** Treat this as a sequencing plan, not an implementation plan for a concrete page. The next session starts from `migration/node-24-lts`, verifies the Node 24 gate, creates the first visible page branch, then writes a page-specific spec and plan before code changes.

**Tech Stack:** Node 24 LTS, pnpm 8, Vue 3, vite-ssr, bwcx/Koa, RanklandApiService, Playwright full-chain E2E.

---

## Source References

- Design spec: `docs/superpowers/specs/2026-05-16-rankland-migration-after-node24-design.md`
- Node upgrade spec: `docs/superpowers/specs/2026-05-16-node-24-lts-upgrade-design.md`
- Node upgrade plan: `docs/superpowers/plans/2026-05-16-node-24-lts-upgrade.md`
- Full-chain E2E design: `docs/superpowers/specs/2026-05-16-full-chain-e2e-foundation-design.md`
- Full-chain E2E plan: `docs/superpowers/plans/2026-05-16-full-chain-e2e-foundation.md`

## Target Files

This sequencing plan should not directly modify application code.

The next concrete page migration plan will decide its own target files after inspecting:

- `src/client/routes.ts`
- `src/common/router/rankland-routes.ts`
- `src/common/rankland-api/rankland-api.service.ts`
- `src/client/modules/`
- `tests/e2e/support/start-full-chain-e2e.js`
- `tests/e2e/full-chain/`
- `tests/fixtures/`

## Task 1: Finish The Node 24 Branch First

**Files:**

- Read: `.node-version`
- Read: `package.json`

- [ ] **Step 1: Switch to the Node branch**

Run:

```bash
cd /Users/cooper/Projects/RankLand/rankland-web
git switch migration/node-24-lts
git status --short --branch
```

Expected:

```text
## migration/node-24-lts
```

- [ ] **Step 2: Verify Node target**

Run:

```bash
cat .node-version
node -e "const pkg=require('./package.json'); console.log(pkg.engines)"
```

Expected:

```text
v24.11.1
{ node: '^24.0.0', pnpm: '^8.0.0' }
```

- [ ] **Step 3: Run the Node 24 migration gate**

Run:

```bash
fnm exec --using v24.11.1 corepack pnpm test:migration
```

Expected:

```text
55 passed
1 passed
1 passed
```

Exit code must be 0.

Do not continue to page migration if this gate fails.

## Task 2: Create The First Visible Page Migration Branch

**Files:**

- No file changes in this task

- [ ] **Step 1: Create the next local branch**

Run:

```bash
git switch -c migration/ranklist-page-foundation
```

Expected:

```text
Switched to a new branch 'migration/ranklist-page-foundation'
```

- [ ] **Step 2: Verify branch state**

Run:

```bash
git status --short --branch
```

Expected:

```text
## migration/ranklist-page-foundation
```

- [ ] **Step 3: Do not merge or push**

Do not run:

```bash
git merge
git push
```

All migration branches remain local unless Cooper explicitly asks otherwise.

## Task 3: Write The Page-Specific Design Spec

**Files:**

- Create: `docs/superpowers/specs/YYYY-MM-DD-ranklist-page-foundation-design.md`

- [ ] **Step 1: Inspect current route and service contracts**

Run:

```bash
rg -n "ranklist|Rankland|routeView|RenderMethodKind|uniqueKey" src/client src/common tests
```

Expected:

- identify the existing RankLand route contract;
- identify `RanklandApiService` methods needed by the page;
- identify existing fixtures the full-chain mock can reuse.

- [ ] **Step 2: Draft the spec**

The spec must include these sections:

```markdown
# RankLand Ranklist Page Foundation Design

## Context

## Selected Route

## Data Requirements

## SSR Behavior

## CSR Behavior

## Full-Chain E2E Strategy

## Mock Backend Extensions

## Out Of Scope

## Acceptance Criteria
```

The spec must explicitly state:

- Node 24 is inherited from `migration/node-24-lts`;
- route mocks are not allowed for app RankLand API calls;
- Playwright may block external browser calls;
- the page must use `RanklandApiService`;
- the probe route remains available as a diagnostic.

- [ ] **Step 3: Commit the page design spec**

Run:

```bash
git add docs/superpowers/specs/YYYY-MM-DD-ranklist-page-foundation-design.md
git commit -m "docs: add ranklist page foundation design"
```

## Task 4: Write The Page-Specific Implementation Plan

**Files:**

- Create: `docs/superpowers/plans/YYYY-MM-DD-ranklist-page-foundation.md`

- [ ] **Step 1: Create a Subagent-Driven plan**

The plan header must start with:

```markdown
# RankLand Ranklist Page Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
```

- [ ] **Step 2: Decompose implementation tasks**

The plan should split work into small tasks:

```markdown
### Task 1: Route And Page Shell

### Task 2: RankLand Service Data Loading

### Task 3: Mock Backend And Fixtures

### Task 4: Full-Chain E2E Coverage

### Task 5: Gate And Artifact Isolation
```

Each task must include:

- exact files to create or modify;
- failing tests before implementation;
- implementation steps;
- commands to run;
- expected output;
- commit command.

- [ ] **Step 3: Commit the page plan**

Run:

```bash
git add docs/superpowers/plans/YYYY-MM-DD-ranklist-page-foundation.md
git commit -m "docs: add ranklist page foundation plan"
```

## Task 5: Execute The Page Plan In A Later Session

**Files:**

- Determined by the page-specific plan

- [ ] **Step 1: Use Subagent-Driven execution**

Use `superpowers:subagent-driven-development`.

For each implementation task:

- dispatch a fresh worker;
- review the worker diff;
- run the task-specific tests;
- do a first review for spec alignment;
- do a second review for code quality and integration risk;
- commit after each accepted task.

- [ ] **Step 2: Run the final migration gate**

Run:

```bash
fnm exec --using v24.11.1 corepack pnpm test:migration
```

Expected:

- build passes;
- unit tests pass;
- SSR tests pass;
- shallow E2E passes;
- full-chain E2E passes.

- [ ] **Step 3: Verify no full-chain E2E process leaks**

Run:

```bash
lsof -iTCP:3100 -sTCP:LISTEN -n -P
lsof -iTCP:3101 -sTCP:LISTEN -n -P
ps -axo pid,command | rg "start-full-chain-e2e|tsnd --respawn|SERVER_PORT=3100|src/server/index.ts"
```

Expected:

- no listener output for ports `3100` or `3101`;
- no lingering matching server process, except the `rg` command itself if visible.

- [ ] **Step 4: Stop before merge or push**

Do not merge or push. Provide Cooper with a handoff that includes:

- branch name;
- HEAD commit;
- verification commands and results;
- files changed;
- remaining migration risks;
- recommended next branch.
