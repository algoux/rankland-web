# RankLand Migration After Node 24 Design

## Context

This document defines the continuation path after `migration/node-24-lts`.

The migration order is now:

```text
migration/vue-api-routing
  -> migration/full-chain-e2e-foundation
  -> migration/node-24-lts
  -> migration/ranklist-page-foundation
```

The full-chain E2E foundation introduced the real migration test path:

```text
Playwright -> bwcx/Koa server -> SSR/CSR -> RankLandApiService -> controlled API backend/mock
```

The Node 24 branch upgrades the runtime target before further visible page work. After that, new migrated pages should run and be verified under Node 24.

## Design Choice

Continue migration with the first visible RankLand page slice after the Node 24 branch passes.

The recommended first branch is:

```text
migration/ranklist-page-foundation
```

The recommended first user-facing target is the ranklist detail page route because it naturally exercises the existing RankLand API service methods and the full-chain mock backend:

- ranklist metadata;
- SRK file download;
- SSR rendering;
- hydration;
- browser-side follow-up calls where needed.

This branch should replace the probe-only confidence from `migration/full-chain-e2e-foundation` with confidence that a real visible route can use the same chain.

## Scope

In scope for the next migration branch:

- Choose and document the first visible RankLand route, with `ranklist` detail as the default.
- Reuse `RanklandApiService` instead of direct axios or route mocks.
- Reuse the full-chain Playwright harness.
- Extend the controlled mock backend only with endpoints needed by the migrated page.
- Add full-chain E2E assertions for real route SSR and hydrated CSR behavior.
- Keep the existing E2E probe route as a foundation diagnostic while the first real page is migrated.
- Keep route URL contracts in common code.
- Keep Node 24 as the runtime target inherited from `migration/node-24-lts`.

Out of scope for the next migration branch:

- Node or pnpm upgrades.
- Whole-app page migration.
- Live contest WebSocket migration.
- Production Mongo/Redis behavior changes.
- SRK renderer parity beyond what the selected page slice requires.
- Removing the probe route.
- Merge or push.

## Expected Branch Baseline

Start from the verified Node 24 branch:

```bash
cd /Users/cooper/Projects/RankLand/rankland-web
git switch migration/node-24-lts
git status --short --branch
fnm exec --using v24.11.1 pnpm test:migration
git switch -c migration/ranklist-page-foundation
```

Do not start from `migration/full-chain-e2e-foundation` once the Node 24 branch exists.

## Migration Principles

Each visible page slice should be small enough to verify in one branch.

The page should:

- use route contracts from common code;
- fetch data through `RanklandApiService`;
- keep SSR and CSR behavior explicit;
- render stable `data-testid` hooks only where E2E needs them;
- prefer existing Vue 3 patterns over reintroducing class/decorator components;
- avoid broad dependency upgrades;
- avoid hidden route mocks that skip the app API path.

Full-chain tests should block browser external calls but should not mock the app's own RankLand API requests with `page.route()`. The app must talk to the controlled backend through the real service path.

## Acceptance Criteria

The next page migration branch is acceptable when:

- it has its own design spec and implementation plan before code changes;
- it runs under Node 24;
- it keeps the full-chain E2E probe passing;
- it adds at least one full-chain E2E assertion for the selected visible route;
- it proves SSR data reaches HTML before hydration;
- it proves browser hydration or browser-side interaction works where the page requires it;
- it keeps existing unit, SSR, shallow E2E, and full-chain E2E gates passing;
- it does not merge, push, or change Node/pnpm targets.

## Handoff Contract

When handing off from Node 24 to page migration, include:

- current branch and HEAD;
- confirmation that Node 24 `test:migration` passed;
- exact command to create the next branch;
- selected visible page scope;
- known full-chain mock endpoints available;
- endpoints or fixtures that still need to be added;
- instruction to continue spec coding with Subagent-Driven execution and two review rounds per task.
