# Ranklist Modal Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire default user and solution modals into the shared Vue `RanklandRanklist` wrapper.

**Architecture:** Keep modal state local to `rankland-ranklist.vue`, using the Vue renderer package's typed click payloads and default modals. Use full-chain E2E for behavior because the wrapper is primarily a rendered interaction surface.

**Tech Stack:** Vue 3 Options API, `@algoux/standard-ranklist-renderer-component-vue`, Playwright full-chain E2E, Vitest migration gate.

---

## File Map

- Modify `src/client/components/rankland-ranklist.vue` to wire click events and modals.
- Modify `tests/fixtures/ranklist.srk.json` to include solution history.
- Modify `tests/e2e/full-chain/live.spec.ts` to assert modal interactions.
- Update this plan as tasks complete.

## Task 1: RED Full-Chain Coverage

- [x] Add solution history to `tests/fixtures/ranklist.srk.json` so status cells are clickable.
- [x] Extend `tests/e2e/full-chain/live.spec.ts` to click `Team Alpha`, assert the user modal, close it, click the first accepted status, and assert the solution modal.
- [x] Run `FULL_CHAIN_APP_PORT=3210 FULL_CHAIN_MOCK_PORT=3211 corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/live.spec.ts` and confirm it fails because the modals are not wired.

## Task 2: Vue Modal Wiring

- [x] Import `DefaultUserModal`, `DefaultSolutionModal`, and click payload types in `rankland-ranklist.vue`.
- [x] Store `activeUserPayload` and `activeSolutionPayload` in component state.
- [x] Pass `@user-click` and `@solution-click` to `Ranklist`.
- [x] Render the two default modals with stable wrapper selectors.
- [x] Re-run the focused full-chain live test and confirm it passes.

## Task 3: Wide Verification And Commit

- [x] Run `corepack pnpm test:migration`.
- [x] Run `git diff --check`.
- [x] Review `git diff --stat`.
- [x] Commit with `feat: 补齐榜单点击弹窗行为`.
