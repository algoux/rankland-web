# Ranklist Rank-Time Modal Parity Implementation Plan

> **For agentic workers:** This plan is implemented in the main session because the slice touches the shared Vue ranklist wrapper and its focused tests.

**Goal:** Add rank-time details to the shared Vue user modal for `/ranklist/:id` and `/live/:id`.

**Architecture:** Keep rank-time calculation in `src/client/components/rankland-rank-time.ts`; keep the SVG/summary UI in `rankland-ranklist.vue`; use unit tests for data correctness and full-chain E2E for visible parity.

---

## File Map

- Add `src/client/components/rankland-rank-time.ts`.
- Add `tests/unit/rankland-rank-time.spec.ts`.
- Modify `src/client/components/rankland-ranklist.vue`.
- Modify `tests/e2e/full-chain/live.spec.ts`.
- Update `docs/migration/status.md`.
- Update this plan as tasks complete.

## Task 1: RED Helper And E2E Tests

- [x] Add failing unit tests for rank-time unit selection, dataset generation, selected user data, and marker miss behavior.
- [x] Extend live full-chain E2E to assert rank-time details inside the user modal.
- [x] Run the focused unit test and confirm it fails because the helper module does not exist.

## Task 2: Rank-Time Helper

- [x] Port the legacy rank-time data calculation into `rankland-rank-time.ts` with no new runtime dependencies.
- [x] Re-run `corepack pnpm exec vitest run tests/unit/rankland-rank-time.spec.ts` and confirm it passes.

## Task 3: Vue Modal Integration

- [x] Import `Modal` and the rank-time helper in `rankland-ranklist.vue`.
- [x] Replace the default user modal with a custom modal that preserves user details and adds the rank-time panel.
- [x] Add stable selectors for E2E coverage.
- [x] Re-run the focused live full-chain E2E test.

## Task 4: Verification And Commit

- [x] Run focused ranklist-related unit tests.
- [x] Run full-chain ranklist and live specs.
- [x] Run `corepack pnpm run build`.
- [x] Run `corepack pnpm test:migration`.
- [x] Run `git diff --check`.
- [x] Update `docs/migration/status.md`.
- [x] Review diff and commit with `feat: 补齐用户弹窗排名时间细节`.
