# Live WebSocket Close Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align migrated `/live/:id` scroll-solution WebSocket close handling with the old React page by treating unexpected socket close as a realtime error while keeping the ranklist visible.

**Architecture:** Keep the existing CSR live page lifecycle and WebSocket stub. Add a deterministic full-chain close emitter in the test helper, prove the current Vue page reports the wrong `closed` status, then minimally map the close event to `error`.

**Tech Stack:** Vue 3, bwcx-client-vue3 route view, Playwright full-chain E2E, RankLand migration docs.

---

### Task 1: Add Failing Full-Chain Close Coverage

**Files:**
- Modify: `tests/e2e/helpers/mock-api.ts`
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [x] **Step 1: Extend the WebSocket stub with a test-only close emitter**

Add a `__ranklandEmitWsClose(url)` hook next to the existing message/error hooks. It should dispatch a `close` event without recording the URL in `__ranklandWsClosedUrls`, because this represents a remote/server close rather than app-driven teardown.

- [x] **Step 2: Write the failing full-chain test**

Add a Playwright test that opens `/live/live-test-key?token=t0&scrollSolution=1`, waits for `connected`, emits a remote close through `__ranklandEmitWsClose`, and expects `data-id="live-scroll-solution-status"` to become `error` while `data-id="live-ranklist-content"` remains visible.

- [x] **Step 3: Run the narrow full-chain test and verify RED**

Run:

```bash
FULL_CHAIN_APP_PORT=3210 FULL_CHAIN_MOCK_PORT=3211 corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/live.spec.ts
```

Result: failed as expected because the current page reported `closed` instead of `error`.

### Task 2: Map Unexpected Close To Error

**Files:**
- Modify: `src/client/modules/live/live.view.vue`

- [x] **Step 1: Implement the minimal production change**

Change the WebSocket `close` listener in `connectScrollSolution()` so an unexpected close sets `scrollSolutionStatus` to `error`, matching the old React `wsError` path and the documented failure-status behavior.

- [x] **Step 2: Run the narrow full-chain test and verify GREEN**

Run:

```bash
FULL_CHAIN_APP_PORT=3210 FULL_CHAIN_MOCK_PORT=3211 corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/live.spec.ts
```

Result: passed, 4 `/live/:id` full-chain tests.

### Task 3: Update Migration Status And Verify

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-19-live-websocket-close-parity.md`

- [x] **Step 1: Update status dashboard**

Set the current slice to `live WebSocket close parity full-chain coverage`, record the narrow/broad gate results after they run, and keep the next recommended focus on live product review or app shell/layout parity.

- [x] **Step 2: Run broad migration verification**

Run:

```bash
corepack pnpm test:migration
git diff --check
```

Result: `corepack pnpm test:migration` passed with unit 120/120, SSR 1/1, E2E 1/1, and full-chain 19/19; `git diff --check` passed.

- [x] **Step 3: Commit the completed slice**

Run:

```bash
git add tests/e2e/helpers/mock-api.ts tests/e2e/full-chain/live.spec.ts src/client/modules/live/live.view.vue docs/migration/status.md docs/superpowers/plans/2026-05-19-live-websocket-close-parity.md
git commit -m "test: 补齐实时榜单 WebSocket 关闭覆盖"
```
