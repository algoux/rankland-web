# SRK Wrapper Visual Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the next `StyledRanklistRenderer` visual parity slice in the shared Vue ranklist wrapper.

**Architecture:** Keep the public wrapper API small by adding an optional `meta` prop to `RanklandRanklist`. Render header metadata and menus in the existing wrapper, using Ant Design Vue dropdown/menu primitives for hover behavior while preserving stable `data-id` selectors for full-chain tests. Update route callers only where the old React pages already passed `meta`, `showFilter`, and `showFooter`.

**Tech Stack:** Vue 3 Options API, ant-design-vue Dropdown/Menu, standard-ranklist-utils, Vitest, Playwright full-chain E2E.

---

## File Map

- Modify `tests/fixtures/ranklist.srk.json` with deterministic contributors and four `contest.refLinks`.
- Modify `tests/e2e/full-chain/ranklist.spec.ts` with failing hover/header metadata assertions.
- Modify `tests/e2e/full-chain/collection.spec.ts` with failing selected-ranklist wrapper assertions.
- Modify `src/client/main.ts` to register any additional Ant Design Vue controls needed by the wrapper.
- Modify `src/client/components/rankland-ranklist.vue` for `meta`, contributors, ref links, and hover dropdown actions.
- Modify `src/client/modules/ranklist/ranklist.view.vue` to pass `meta`.
- Modify `src/client/modules/collection/collection.view.vue` to pass `meta` and wrapper controls.
- Update `docs/migration/status.md` after verification.

## Tasks

- [x] Write this spec and plan for the SRK wrapper visual parity slice.
- [x] Add RED full-chain assertions for ranklist wrapper metadata, hover dropdown open/close, contributors, and ref links.
- [x] Add RED full-chain assertions for collection selected-ranklist wrapper header/filter/progress/footer/action parity.
- [x] Run focused full-chain tests and confirm the expected failures are caused by missing parity behavior.
- [x] Implement `meta` and header helper methods in `rankland-ranklist.vue`.
- [x] Replace native `details` export/share menus with Ant Design Vue hover dropdown/menu markup while keeping existing action handlers and test selectors.
- [x] Update `/ranklist/:id` and `/collection/:id` callers to pass the old React wrapper options.
- [x] Run focused ranklist and collection full-chain tests until green.
- [x] Run `corepack pnpm run gen:client-router`.
- [x] Run `corepack pnpm test:migration`.
- [x] Run `git diff --check`.
- [x] Update `docs/migration/status.md`.
- [x] Commit with `feat: 收口榜单渲染器视觉一致性`.
