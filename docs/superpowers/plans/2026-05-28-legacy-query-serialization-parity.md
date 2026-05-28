# Legacy Query Serialization Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React/urlcat query string serialization in shared RankLand route builders.

**Architecture:** Keep the existing `ranklandRoutes` API. Change only query serialization semantics and the Search submit call site that currently discards an explicit empty string.

**Tech Stack:** TypeScript common route helper, Vue Search route, Vitest, Playwright full-chain tests.

---

## File Structure

- Modify: `src/common/rankland-router/routes.ts`
- Modify: `src/client/modules/search/search.view.vue`
- Modify: `tests/unit/rankland-routes.spec.ts`
- Modify: `tests/e2e/full-chain/search.spec.ts`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

## Tasks

### Task 1: RED Tests

- [x] Update `tests/unit/rankland-routes.spec.ts` to expect old urlcat query serialization:
  - Search spaces as `+`;
  - Search empty string as `/search?kw=`;
  - Collection/Live query values with spaces as `+`;
  - omitted values still omitted.
- [x] Update `tests/e2e/full-chain/search.spec.ts` so whitespace submit expects `+Test+2024+`, and empty submit expects `/search?kw=`.
- [x] Run:

```bash
corepack pnpm exec vitest run tests/unit/rankland-routes.spec.ts
```

- [x] Expected RED: route builder tests fail because current `buildQuery()` filters empty strings and uses `%20` for query spaces.

### Task 2: Minimal Implementation

- [x] Change `buildQuery()` to filter only `undefined` values and serialize with `URLSearchParams`.
- [x] Keep `encodePathValue()` unchanged for path params.
- [x] Change Search `submitSearch()` to pass the explicit keyword string through to `ranklandRoutes.search.build()`.

### Task 3: GREEN Verification

- [x] Re-run `corepack pnpm exec vitest run tests/unit/rankland-routes.spec.ts`.
- [x] Run focused Search full-chain:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "preserves legacy keyword whitespace"
```

### Task 4: Migration Docs

- [x] Update `docs/migration/status.md` with current slice, route coverage evidence, latest gate, and next queue.
- [x] Update `docs/migration/manual-acceptance-checklist.md` with query serialization acceptance notes.
- [x] Update `docs/migration/final-integration-review.md` with the verified slice.

### Task 5: Full Gate And Commit

- [x] Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

- [x] Expected: Node 24, pnpm 8, route generation succeeds, migration tests pass, whitespace check passes.
- [x] Inspect `git status --short`.
- [x] Commit with:

```bash
git add src/common/rankland-router/routes.ts src/client/modules/search/search.view.vue tests/unit/rankland-routes.spec.ts tests/e2e/full-chain/search.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-legacy-query-serialization-parity-design.md docs/superpowers/plans/2026-05-28-legacy-query-serialization-parity.md
git commit -m "fix: 还原旧版查询串序列化"
```
