# Ranklist Export Share Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shared SRK JSON export and share/embed copy actions to the Vue ranklist wrapper for ranklist and live pages.

**Architecture:** Keep deterministic string/file generation in `src/client/components/rankland-ranklist-actions.ts` so it can be unit-tested without browser APIs. Keep browser side effects in `rankland-ranklist.vue` click handlers and only execute them after hydration.

**Tech Stack:** Vue 3 Options API, standard-ranklist types, common RankLand route builders, Vitest, Playwright full-chain E2E.

---

## File Map

- Create `src/client/components/rankland-ranklist-actions.ts` for pure action helpers.
- Create `tests/unit/rankland-ranklist-actions.spec.ts` for RED unit coverage.
- Modify `src/client/components/rankland-ranklist.vue` with export/share menus, status text, and browser-only handlers.
- Modify `src/client/modules/ranklist/ranklist.view.vue` to opt into shared header/progress/filter/footer parity.
- Modify `tests/e2e/full-chain/ranklist.spec.ts` for ranklist action coverage.
- Modify `tests/e2e/full-chain/live.spec.ts` for live action coverage.
- Update this plan as tasks complete.

## Task 1: Helper Tests And Implementation

- [x] Add failing unit tests for SRK export metadata, share URL focus-query cleanup, and iframe embed code in `tests/unit/rankland-ranklist-actions.spec.ts`.
- [x] Run `corepack pnpm exec vitest run tests/unit/rankland-ranklist-actions.spec.ts` and confirm it fails because the helper module does not exist.
- [x] Implement `src/client/components/rankland-ranklist-actions.ts`.
- [x] Re-run the focused helper test and confirm it passes.

## Task 2: Shared Wrapper Actions

- [x] Update `rankland-ranklist.vue` to render export/share menus in the header when `showHeader` is enabled.
- [x] Add browser-only handlers for SRK JSON download, copy current page link, and copy embed code.
- [x] Run `corepack pnpm exec vitest run tests/unit/rankland-ranklist-actions.spec.ts tests/unit/rankland-ranklist-state.spec.ts`.

## Task 3: Ranklist Route Opt-In

- [x] Update `ranklist.view.vue` to pass `name`, `id`, `show-header`, `show-filter`, `show-progress`, `show-footer`, and `table-class` to `RanklandRanklist`.
- [x] Remove the duplicate standalone ranklist title from the route body.
- [x] Extend `tests/e2e/full-chain/ranklist.spec.ts` to assert wrapper controls, download SRK JSON, copy the page link, and copy ranklist embed code.
- [x] Run `FULL_CHAIN_APP_PORT=3210 FULL_CHAIN_MOCK_PORT=3211 corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/ranklist.spec.ts`.

## Task 4: Live Route Proof

- [x] Extend `tests/e2e/full-chain/live.spec.ts` to assert action menus and copy live embed code.
- [x] Run `FULL_CHAIN_APP_PORT=3210 FULL_CHAIN_MOCK_PORT=3211 corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/live.spec.ts`.

## Task 5: Wide Verification And Commit

- [x] Run `node -v`.
- [x] Run `corepack pnpm -v`.
- [x] Run `corepack pnpm test:migration`.
- [x] Run `git diff --check`.
- [x] Update `docs/migration/status.md` because this slice changes shared SRK wrapper parity state.
- [x] Review `git diff --stat`.
- [x] Commit with `feat: 补齐榜单导出分享入口`.
