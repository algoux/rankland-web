# RankLand Node 24 LTS Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the RankLand web migration baseline from Node 16 to Node 24 LTS while keeping pnpm on major version 8 and preserving the full migration gate.

**Architecture:** Treat the upgrade as a runtime/tooling target change only. Update version declarations, verify the existing locked dependency graph under Node 24, and leave application migration work to the next branch.

**Tech Stack:** Node 24 LTS, pnpm 8, Vue 3, vite-ssr, bwcx/Koa, Vitest, Playwright, existing full-chain E2E harness.

---

## Source References

- Design spec: `docs/superpowers/specs/2026-05-16-node-24-lts-upgrade-design.md`
- Current Node pin: `.node-version`
- Current package engines: `package.json`
- Full-chain E2E harness: `tests/e2e/support/start-full-chain-e2e.js`
- Full migration gate: `package.json` script `test:migration`

## Target Files

- Modify: `.node-version`
- Modify: `package.json`
- Modify: `tests/e2e/support/start-full-chain-e2e.js`
- Optional modify: `docs/superpowers/specs/2026-05-16-node-24-lts-upgrade-design.md` if verification exposes a decision that must be recorded
- Optional modify: `docs/superpowers/plans/2026-05-16-node-24-lts-upgrade.md` if execution discovers a missing verification step

## Task 1: Record The Node 24 Runtime Target

**Files:**

- Modify: `.node-version`
- Modify: `package.json`

- [ ] **Step 1: Verify starting branch and clean tree**

Run:

```bash
cd /Users/cooper/Projects/RankLand/rankland-web
git status --short --branch
```

Expected:

```text
## migration/node-24-lts
```

There should be no unrelated working-tree changes before editing runtime files.

- [ ] **Step 2: Update `.node-version`**

Change `.node-version` from:

```text
v16.20.1
```

to:

```text
v24.11.1
```

- [ ] **Step 3: Update `package.json` package manager and engines**

Set package-manager metadata and change the `engines` block in `package.json` from:

```json
"packageManager": "pnpm@8.15.9",
"engines": {
  "node": "^16.0.0",
  "pnpm": "^8.0.0"
}
```

to:

```json
"packageManager": "pnpm@8.15.9",
"engines": {
  "node": "^24.0.0",
  "pnpm": "^8.0.0"
}
```

Do not change dependencies, devDependencies, overrides, or lockfile content in this task.

Also update recursive pnpm scripts so they resolve through Corepack under Node 24:

```json
"test": "corepack pnpm test:unit",
"test:migration": "corepack pnpm run build && corepack pnpm test:unit && corepack pnpm test:ssr && corepack pnpm test:e2e && corepack pnpm test:e2e:full-chain",
"init": "corepack pnpm i --frozen-lockfile",
"build": "corepack pnpm run build:client && corepack pnpm run build:server"
```

Leave scripts that do not recursively invoke pnpm unchanged.

Also change the full-chain app launcher from:

```js
appProcess = spawn('pnpm', ['run', 'dev:start'], {
```

to:

```js
appProcess = spawn('corepack', ['pnpm', 'run', 'dev:start'], {
```

- [ ] **Step 4: Verify the manifest parses**

Run:

```bash
node -e "const pkg=require('./package.json'); console.log(pkg.engines)"
```

Expected output includes:

```text
{ node: '^24.0.0', pnpm: '^8.0.0' }
```

Also verify:

```bash
node -e "const pkg=require('./package.json'); console.log(pkg.packageManager)"
```

Expected:

```text
pnpm@8.15.9
```

- [ ] **Step 5: Commit the runtime target change**

Run:

```bash
git add .node-version package.json
git commit -m "chore: target Node 24 LTS"
```

## Task 2: Verify Install And Build Under Node 24 With pnpm 8

**Files:**

- Read: `pnpm-lock.yaml`
- Read: `package.json`

- [ ] **Step 1: Confirm Node and pnpm versions**

Run:

```bash
fnm exec --using v24.11.1 node -v
fnm exec --using v24.11.1 corepack pnpm -v
```

Expected:

```text
v24.11.1
8.15.9
```

If direct `pnpm -v` reports `10.x`, continue using `corepack pnpm` for this branch.

Do not change `engines.pnpm` to pnpm 10 in this branch.

- [ ] **Step 2: Verify frozen install**

Run with pnpm 8 under Node 24:

```bash
fnm exec --using v24.11.1 corepack pnpm install --frozen-lockfile
```

Expected:

```text
Lockfile is up to date
```

or an equivalent pnpm success message with exit code 0.

- [ ] **Step 3: Verify production build**

Run with pnpm 8 under Node 24:

```bash
fnm exec --using v24.11.1 corepack pnpm run build
```

Expected:

```text
vite v2.7.13 building for production...
...
tsc -p src/server/tsconfig.json
```

Exit code must be 0. The existing `vite-ssr` CJS/ESM warning may appear and should be recorded if present.

- [ ] **Step 4: Commit only if verification required documentation changes**

If Task 2 caused no file changes, do not commit.

If documentation was updated with a newly discovered toolchain constraint, run:

```bash
git add docs/superpowers/specs/2026-05-16-node-24-lts-upgrade-design.md docs/superpowers/plans/2026-05-16-node-24-lts-upgrade.md
git commit -m "docs: record Node 24 verification constraint"
```

## Task 3: Run The Node 24 Test Matrix

**Files:**

- Read: `package.json`
- Read: `playwright.config.ts`
- Read: `playwright.full-chain.config.ts`

- [ ] **Step 1: Run unit tests**

Run:

```bash
fnm exec --using v24.11.1 corepack pnpm test:unit
```

Expected:

```text
Test Files  8 passed (8)
Tests  55 passed (55)
```

- [ ] **Step 2: Run SSR smoke tests**

Run:

```bash
fnm exec --using v24.11.1 corepack pnpm test:ssr
```

Expected:

```text
Test Files  1 passed (1)
Tests  1 passed (1)
```

- [ ] **Step 3: Run shallow Playwright E2E**

Run:

```bash
fnm exec --using v24.11.1 corepack pnpm test:e2e
```

Expected:

```text
1 passed
```

- [ ] **Step 4: Run full-chain Playwright E2E**

Run:

```bash
fnm exec --using v24.11.1 corepack pnpm test:e2e:full-chain
```

Expected:

```text
1 passed
```

- [ ] **Step 5: Verify no full-chain test ports remain open**

Run:

```bash
lsof -iTCP:3100 -sTCP:LISTEN -n -P
lsof -iTCP:3101 -sTCP:LISTEN -n -P
ps -axo pid,command | rg "start-full-chain-e2e|tsnd --respawn|SERVER_PORT=3100|src/server/index.ts"
```

Expected:

- no listener output for ports `3100` or `3101`;
- no lingering matching server process, except the `rg` command itself if visible.

## Task 4: Run The Final Node 24 Gate And Prepare The Migration Baseline

**Files:**

- Read: `package.json`
- Read: `.node-version`

- [ ] **Step 1: Run the full migration gate**

Run:

```bash
fnm exec --using v24.11.1 corepack pnpm test:migration
```

Expected:

```text
pnpm run build
...
55 passed
...
1 passed
...
1 passed
```

Exit code must be 0.

- [ ] **Step 2: Verify git state**

Run:

```bash
git status --short --branch
git log --oneline --decorate -5
```

Expected:

```text
## migration/node-24-lts
```

The latest local commit should include `chore: target Node 24 LTS`.

- [ ] **Step 3: Write the next-session handoff**

Include these facts in the final handoff:

- branch is `migration/node-24-lts`;
- no merge or push was performed;
- Node target is Node 24 LTS;
- pnpm remains major version 8;
- `test:migration` passed under Node 24;
- next branch should be created from `migration/node-24-lts`;
- next branch should be `migration/ranklist-page-foundation` unless Cooper chooses a different first visible page slice.

- [ ] **Step 4: Stop**

Do not start page migration in this branch. Page migration begins in the next branch after Node 24 is verified.
