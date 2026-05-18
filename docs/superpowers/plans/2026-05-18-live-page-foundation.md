# Live Page Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/live/:id` CSR migration foundation with live API loading, polling, guarded scroll-solution WebSocket, generated route coverage, and full-chain E2E verification.

**Architecture:** Keep the page CSR-only and load live data after hydration through the injected `RanklandApiService`. Add small live-specific helpers for error classification and realtime binary parsing so they can be unit-tested independently. Reuse the existing `RanklandRanklist` renderer wrapper instead of migrating advanced renderer controls in this slice.

**Tech Stack:** Vue 3, bwcx route generation, RankLand shared API service, Vitest, Playwright full-chain E2E.

---

### File Map

- Create: `src/common/modules/live/live.rpo.ts` for route param binding.
- Create: `src/client/modules/live/live-error.ts` for page error classification.
- Create: `src/client/modules/live/realtime-solutions.ts` for binary scroll-solution parsing.
- Create: `src/client/modules/live/live-scroll-solution.vue` for the minimal visible scroll-solution event panel.
- Create: `src/client/modules/live/live.view.vue` for the CSR page.
- Create: `tests/unit/live-error.spec.ts` for load-error classification.
- Create: `tests/unit/realtime-solutions.spec.ts` for binary parsing.
- Create: `tests/e2e/full-chain/live.spec.ts` for full-chain route behavior.
- Modify: `src/common/rankland-api/rankland-api.service.ts` to map live NotFound errors.
- Modify: `tests/unit/rankland-api.service.spec.ts` to cover live NotFound mapping.
- Modify: `vite.config.js` and `tests/unit/vite-config.spec.ts` to expose live client env.
- Modify: `tests/e2e/helpers/mock-api.ts` to record stubbed WebSocket URLs.
- Modify: `tests/e2e/support/start-full-chain-e2e.js` to provide live env and missing-live mock behavior.
- Modify: `tests/unit/client-routes.spec.ts` and generated route files after running `corepack pnpm run gen:client-router`.
- Modify: `docs/migration/playbook.md` after full-chain coverage passes.

### Task 1: Live API and Helpers

- [x] Write failing unit tests for live NotFound mapping in `tests/unit/rankland-api.service.spec.ts`.
- [x] Run `corepack pnpm exec vitest run tests/unit/rankland-api.service.spec.ts` and confirm the new tests fail because live methods rethrow `RanklandApiException`.
- [x] Add a shared private mapper in `src/common/rankland-api/rankland-api.service.ts` and use it in `getLiveRanklistInfo` and `getLiveRanklist`.
- [x] Create `tests/unit/live-error.spec.ts` and `src/client/modules/live/live-error.ts`.
- [x] Create `tests/unit/realtime-solutions.spec.ts` and `src/client/modules/live/realtime-solutions.ts`.
- [x] Run the focused unit tests and confirm they pass.

### Task 2: Client Env and Route Shell

- [x] Write failing assertions in `tests/unit/vite-config.spec.ts` for `RANKLAND_LIVE_POLLING_INTERVAL` and `RANKLAND_WS_BASE`.
- [x] Add those keys to `clientProcessEnv` in `vite.config.js`.
- [x] Create `src/common/modules/live/live.rpo.ts`.
- [x] Create `src/client/modules/live/live.view.vue` with a CSR `routeView(LivePage, '/live/:id', LiveRPO)` export.
- [x] Run `corepack pnpm run gen:client-router`.
- [x] Update `tests/unit/client-routes.spec.ts` to assert the generated `Live` route has path `/live/:id`, uses `LiveRPO`, and has no SSR render method.
- [x] Run `corepack pnpm exec vitest run tests/unit/vite-config.spec.ts tests/unit/client-routes.spec.ts`.

### Task 3: Live Page Behavior

- [x] Implement mounted client loading in `live.view.vue`: info fetch, ranklist fetch, polling interval, loading state, not-found/generic states, title metadata, and ranklist render.
- [x] Implement query handling for `token`, `scrollSolution`, and `focus`.
- [x] Create `live-scroll-solution.vue` and wire optional WebSocket setup behind `scrollSolution=1`.
- [x] Ensure interval and socket cleanup run before route reloads and on unmount.
- [x] Run focused unit tests and `corepack pnpm run build` to catch type/template errors.

### Task 4: Full-Chain E2E

- [x] Extend the full-chain launcher env with deterministic live polling and WebSocket base values.
- [x] Extend the WebSocket stub helper so tests can read constructed URLs.
- [x] Create `tests/e2e/full-chain/live.spec.ts` covering `/live/live-test-key?token=t0&scrollSolution=1&focus=yes`.
- [x] Assert live config/ranklist requests, token preservation, rendered rows, hydration marker, WebSocket URL, and no CDN rank/file calls.
- [x] Run `FULL_CHAIN_APP_PORT=3210 FULL_CHAIN_MOCK_PORT=3211 corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/live.spec.ts`.

### Task 5: Docs, Wide Verification, Commit

- [x] Update `docs/migration/playbook.md` remaining backlog to include `/live/:id` in completed route foundations.
- [x] Run `corepack pnpm test:migration`.
- [x] Run `git diff --check`.
- [x] Review `git diff --stat` and generated route diffs.
- [x] Commit with `feat: 迁移实时榜单页面基础视图`.
