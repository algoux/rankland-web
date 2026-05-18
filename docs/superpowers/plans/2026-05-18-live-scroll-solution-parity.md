# Live Scroll-Solution Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the old live scroll-solution queue and toast-like presentation into the Vue live page.

**Architecture:** Keep WebSocket parsing in `live.view.vue`, move queue math and result grouping into a small TypeScript helper, and keep rendering in `live-scroll-solution.vue`. The Vue page owns timers and cleanup because it already owns polling/socket lifecycle.

**Tech Stack:** Vue 3 Options API, Vitest, Playwright full-chain E2E, LESS scoped styles.

---

### File Map

- Create: `src/client/modules/live/live-scroll-solution-state.ts` for constants and queue helper functions.
- Create: `tests/unit/live-scroll-solution-state.spec.ts` for TDD coverage.
- Modify: `src/client/modules/live/live-scroll-solution.vue` to use visual result classes and fixed row layout.
- Modify: `src/client/modules/live/live.view.vue` to use queue helpers, timers, visible limit, and ranklist offset.
- Modify: `tests/e2e/helpers/mock-api.ts` to let the WebSocket stub emit binary messages.
- Modify: `tests/e2e/full-chain/live.spec.ts` to assert emitted scroll-solution rows.
- Modify: `docs/superpowers/plans/2026-05-18-live-scroll-solution-parity.md` to check off completed tasks.

### Task 1: Queue Helper

- [x] Write failing unit tests in `tests/unit/live-scroll-solution-state.spec.ts` for `getScrollSolutionVisibleLimit`, `getScrollSolutionResultClass`, `enqueueScrollSolutions`, and `getNextScrollSolutionPop`.
- [x] Run `corepack pnpm exec vitest run tests/unit/live-scroll-solution-state.spec.ts` and confirm it fails because the helper module does not exist.
- [x] Implement `src/client/modules/live/live-scroll-solution-state.ts` with the legacy constants `ITEM_HEIGHT = 45`, `POP_LIMIT = 20`, `POP_INTERVAL = 200`, and `MIN_DELAY = 1000`.
- [x] Re-run `corepack pnpm exec vitest run tests/unit/live-scroll-solution-state.spec.ts` and confirm it passes.

### Task 2: Vue Wiring

- [x] Update `live.view.vue` to maintain a scroll-solution queue, pop timer, visible limit, and immediate `FB` display.
- [x] Update `live-scroll-solution.vue` to render score, user, organization, problem, and grouped result classes in a 250px bottom-left panel.
- [x] Run `corepack pnpm exec vitest run tests/unit/live-scroll-solution-state.spec.ts tests/unit/realtime-solutions.spec.ts`.

### Task 3: Full-Chain Proof

- [x] Extend `stubWebSocket` with a browser-side `__ranklandEmitWsMessage(url, data)` hook.
- [x] Update `tests/e2e/full-chain/live.spec.ts` to emit one realtime binary solution and assert the visible row.
- [x] Run `FULL_CHAIN_APP_PORT=3210 FULL_CHAIN_MOCK_PORT=3211 corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/live.spec.ts`.

### Task 4: Wide Verification And Commit

- [x] Run `corepack pnpm test:migration`.
- [x] Run `git diff --check`.
- [x] Review `git diff --stat`.
- [x] Commit with `feat: 补齐实时提交滚动面板行为`.
