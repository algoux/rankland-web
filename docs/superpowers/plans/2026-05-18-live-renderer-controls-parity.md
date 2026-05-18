# Live Renderer Controls Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the `StyledRanklist` controls needed by `/live/:id`: header, progress, filters, footer, and extra action slot.

**Architecture:** Keep the SRK transformation logic in `src/client/components/rankland-ranklist-state.ts` so it can be unit-tested without Vue rendering. Keep the Vue component opt-in for new controls to avoid changing existing page behavior.

**Tech Stack:** Vue 3 Options API, Vue SRK renderer package, standard-ranklist-utils, Vitest, Playwright full-chain E2E.

---

## File Map

- Modify `tests/unit/rankland-ranklist-state.spec.ts` for RED coverage.
- Modify `src/client/components/rankland-ranklist-state.ts` with filter/time-travel derivation.
- Modify `src/client/components/rankland-ranklist.vue` with optional controls and footer.
- Modify `src/client/modules/live/live.view.vue` to pass live wrapper options and slot the scroll-solution switch.
- Modify `tests/e2e/full-chain/live.spec.ts` to assert controls and filter behavior.
- Update this plan as tasks complete.

## Task 1: State Helper Tests And Implementation

- [x] Add failing unit tests for organization, official-only, marker, statistics, and time-travel behavior in `tests/unit/rankland-ranklist-state.spec.ts`.
- [x] Run `corepack pnpm exec vitest run tests/unit/rankland-ranklist-state.spec.ts` and confirm the new tests fail against the current helper.
- [x] Implement filter/time-travel support in `src/client/components/rankland-ranklist-state.ts`.
- [x] Re-run the focused unit test and confirm it passes.

## Task 2: Vue Wrapper Controls

- [x] Update `rankland-ranklist.vue` with optional header, progress bar, filters, extra-action slot, and footer.
- [x] Update `live.view.vue` to pass `name`, `id`, `show-header`, `show-filter`, `show-progress`, `show-footer`, and `is-live`, and move the scroll toggle into the wrapper slot.
- [x] Run `corepack pnpm exec vitest run tests/unit/rankland-ranklist-state.spec.ts`.

## Task 3: Full-Chain Proof

- [x] Extend `tests/e2e/full-chain/live.spec.ts` to assert the wrapper controls and filter behavior.
- [x] Run `FULL_CHAIN_APP_PORT=3210 FULL_CHAIN_MOCK_PORT=3211 corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/live.spec.ts`.

## Task 4: Wide Verification And Commit

- [x] Run `corepack pnpm test:migration`.
- [x] Run `git diff --check`.
- [x] Review `git diff --stat`.
- [x] Commit with `feat: 补齐实时榜单渲染控件`.
