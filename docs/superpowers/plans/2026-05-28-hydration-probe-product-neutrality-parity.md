# Hydration Probe Product Neutrality Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make route hydration/debug probes product-neutral without weakening full-chain test observability.

**Architecture:** Keep existing per-route marker DOM and CSS. Add a consistent out-of-flow and `aria-hidden` contract to the existing test-only probe nodes.

**Tech Stack:** Vue 3 SFC templates/styles, Playwright full-chain tests, existing migration docs.

---

## File Structure

- Modify: `src/client/modules/home/home.view.vue`
- Modify: `src/client/modules/search/search.view.vue`
- Modify: `src/client/modules/ranklist/ranklist.view.vue`
- Modify: `src/client/modules/collection/collection.view.vue`
- Modify: `src/client/modules/live/live.view.vue`
- Modify: `src/client/modules/playground/playground.view.vue`
- Modify: `tests/e2e/full-chain/home.spec.ts`
- Modify: `tests/e2e/full-chain/search.spec.ts`
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `tests/e2e/full-chain/collection.spec.ts`
- Modify: `tests/e2e/full-chain/live.spec.ts`
- Modify: `tests/e2e/full-chain/playground.spec.ts`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

## Tasks

### Task 1: RED Tests

- [x] Add `aria-hidden="true"` assertions to every route hydration marker in the existing full-chain route tests.
- [x] Add `position: absolute` assertions where missing: Home, Search, Ranklist, Collection, and Live.
- [x] Add `aria-hidden="true"` assertion to the Playground editor-ready probe.
- [x] Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "shows recent ranklists"
```

- [x] Expected RED: fails because the current Search hydration probe is not `aria-hidden` and is still in normal document flow.

### Task 2: Minimal Implementation

- [x] Add `aria-hidden="true"` to Home, Search, Ranklist, Collection, Live, Playground hydration probes, and the Playground editor-ready probe.
- [x] Add `position: absolute` to `.home-hydrated`, `.search-hydrated`, `.ranklist-hydrated`, `.collection-hydrated`, and `.live-hydrated`.
- [x] Preserve all existing marker text and `data-id` values.

### Task 3: GREEN Verification

- [x] Re-run the focused Search full-chain test.
- [x] Expected GREEN: Search marker is still readable and now satisfies the product-neutral probe contract.

### Task 4: Migration Docs

- [x] Update `docs/migration/status.md` with current slice, route coverage evidence, latest gate, and next queue.
- [x] Update `docs/migration/manual-acceptance-checklist.md` with the hidden probe acceptance notes.
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
git add src/client/modules/home/home.view.vue src/client/modules/search/search.view.vue src/client/modules/ranklist/ranklist.view.vue src/client/modules/collection/collection.view.vue src/client/modules/live/live.view.vue src/client/modules/playground/playground.view.vue tests/e2e/full-chain/home.spec.ts tests/e2e/full-chain/search.spec.ts tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/collection.spec.ts tests/e2e/full-chain/live.spec.ts tests/e2e/full-chain/playground.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-hydration-probe-product-neutrality-parity-design.md docs/superpowers/plans/2026-05-28-hydration-probe-product-neutrality-parity.md
git commit -m "fix: 隔离公开路由 hydration 探针"
```
