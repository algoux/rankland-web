# RankLand Node 24 LTS Upgrade Design

## Context

This slice starts from local branch `migration/full-chain-e2e-foundation` and runs on local branch `migration/node-24-lts`.

The full-chain E2E foundation is complete and has verified the current migration gate under the repository-compatible Node 16 toolchain. The next migration decision is runtime support: upgrade the project target before continuing user-facing RankLand page migration.

Before this branch, the repository declared:

```json
{
  "engines": {
    "node": "^16.0.0",
    "pnpm": "^8.0.0"
  }
}
```

It did not pin `packageManager`, so the user's default Node 24 shell could resolve to pnpm 10 even though the project wanted pnpm 8.

The repository also pins local runtime selection with:

```text
.node-version -> v16.20.1
```

Node 16 is no longer a viable target for ongoing migration work. The project should move to the newest practical LTS target before new migrated pages accumulate more runtime assumptions.

## Verified Baseline

Before this spec, the current dependency set was probed with the installed local Node versions.

Using `pnpm@8.15.9` and temporarily bypassing the stale `engines.node` declaration:

- Node 18 ran `pnpm run build`.
- Node 20 ran `pnpm run build`.
- Node 22 ran `pnpm run build`.
- Node 24 ran `pnpm run build`.
- Node 24 ran the full migration gate:

```bash
fnm exec --using v24.11.1 npx --cache /tmp/rankland-npx-node24 -y pnpm@8.15.9 --config.engine-strict=false test:migration
```

That full gate passed:

- production build;
- 55 unit tests;
- SSR smoke test;
- shallow Playwright E2E;
- full-chain Playwright E2E.

The observed blocker under the user's default shell was not application code. It was the explicit engine mismatch:

```text
Expected node: ^16.0.0
Expected pnpm: ^8.0.0
Got node: v22.22.0
Got pnpm: 10.28.2
```

## Decision

Upgrade the project runtime target directly to Node 24 LTS.

Keep pnpm on major version 8 for this slice.

Do not upgrade application dependencies, Vite, Vitest, Playwright, TypeScript, Vue, bwcx packages, or pnpm major version in this branch unless the Node 24 gate exposes a specific blocker that cannot be solved otherwise.

## Rationale

Node 24 is the best target because:

- it is the newest LTS target available for the migration line;
- it gives the longest support runway;
- the current dependency set already passed the full migration gate under Node 24 when the stale engine guard was bypassed;
- using Node 22 as an intermediate target would create a short-lived branch without reducing much practical risk.

Node 18 and Node 20 are not useful migration targets because they are already past or too close to the end of their practical support window for this work.

pnpm 10 is intentionally out of scope because the current lockfile and install path are already stable under pnpm 8. A package-manager major upgrade changes resolver behavior, lockfile format expectations, and local/CI bootstrap behavior. That belongs in a separate branch after Node 24 is stable.

## Scope

In scope:

- Change `.node-version` from Node 16 to Node 24 LTS.
- Change `package.json` `engines.node` from `^16.0.0` to a Node 24 range.
- Keep `engines.pnpm` on `^8.0.0`.
- Add or verify `packageManager: "pnpm@8.15.9"` so Corepack can resolve the intended pnpm major under Node 24.
- Route package scripts that invoke pnpm recursively through `corepack pnpm`, because this local fnm environment can otherwise resolve nested script calls to pnpm 10.
- Route the full-chain E2E server launcher through `corepack pnpm` for the same reason.
- Verify install, build, unit, SSR, shallow E2E, and full-chain E2E under Node 24.
- Verify the app server lifecycle leaves no full-chain E2E process or port leaks.
- Record the post-upgrade branch handoff for page migration.

Out of scope:

- pnpm 10 upgrade.
- Vite/Vitest/Playwright/TypeScript/Vue major upgrades.
- RankLand visible page migration.
- API service behavior changes.
- Full-chain E2E harness redesign.
- Merge or push.

## Target State

The branch should end with:

```text
.node-version -> v24.11.1
```

and:

```json
{
  "packageManager": "pnpm@8.15.9",
  "engines": {
    "node": "^24.0.0",
    "pnpm": "^8.0.0"
  }
}
```

The final verification command should use Node 24 and pnpm 8 without bypassing the package engine:

```bash
fnm exec --using v24.11.1 corepack pnpm test:migration
```

If the user's globally resolved `pnpm` under Node 24 remains pnpm 10, local commands should use `corepack pnpm` until a separate pnpm upgrade branch changes that target.

## Risks

The highest-risk dependencies are older toolchain packages:

- `vite@2.7.13`;
- `vite-ssr@0.16.0`;
- `ts-node-dev@1.1.8`;
- `typescript~4.6.2`;
- `vue-class-component` and `vue-property-decorator`.

The known `vite-ssr` CJS/ESM warning already appears under the current toolchain. It should be tracked as a warning, not treated as a Node 24 regression unless it becomes a failure.

In this local environment, `fnm exec --using v24.11.1 corepack pnpm <script>` correctly starts pnpm 8, but package scripts and child processes that call bare `pnpm` can still resolve nested calls to pnpm 10. The branch should therefore update recursive package scripts such as `build`, `test`, `test:migration`, and `init` to use `corepack pnpm`, and update the full-chain E2E launcher to spawn `corepack pnpm run dev:start`.

The full-chain E2E command starts a real bwcx/Koa dev server. The Node 24 upgrade must keep the cleanup guarantees from `migration/full-chain-e2e-foundation`: no lingering app server, mock backend, inspector process, or occupied test ports after the run.

## Acceptance Criteria

The Node 24 branch is acceptable when:

- `.node-version` targets Node 24 LTS.
- `package.json` declares Node 24 support and still declares pnpm 8 support.
- `package.json` pins `packageManager` to pnpm 8 for Corepack.
- `fnm exec --using v24.11.1 corepack pnpm run build` passes.
- `fnm exec --using v24.11.1 corepack pnpm test:unit` passes.
- `fnm exec --using v24.11.1 corepack pnpm test:ssr` passes.
- `fnm exec --using v24.11.1 corepack pnpm test:e2e` passes.
- `fnm exec --using v24.11.1 corepack pnpm test:e2e:full-chain` passes.
- `fnm exec --using v24.11.1 corepack pnpm test:migration` passes.
- Full-chain E2E leaves no process listening on ports `3100` or `3101`.
- The branch remains local and unpushed.

## Follow-On Work

After this branch is verified, page migration should continue from `migration/node-24-lts`, not from `migration/full-chain-e2e-foundation`.

The next migration branch should be a visible RankLand page slice, for example:

```text
migration/ranklist-page-foundation
```

That branch should reuse the full-chain E2E harness and run under Node 24.
