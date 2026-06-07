# Final Integration Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce and verify the final integration review that proves the RankLand Vue migration is ready as the route-compatible migrated frontend, with deferred polish explicitly documented.

**Architecture:** Treat this as a documentation-plus-verification slice. Use existing source files, generated route outputs, unit/SSR/E2E/full-chain tests, and migration docs as evidence; do not change product behavior unless verification exposes a concrete defect.

**Tech Stack:** Vue 3, bwcx, vite-ssr, Vitest, Playwright, RanklandApiService, Node 24, pnpm 8.

---

## File Structure

- Create `docs/superpowers/specs/2026-05-23-final-integration-review-design.md`: final review scope and acceptance criteria.
- Create `docs/superpowers/plans/2026-05-23-final-integration-review.md`: execution checklist.
- Create `docs/migration/final-integration-review.md`: requirement-by-requirement evidence table.
- Modify `docs/migration/status.md`: current focus, final review gate evidence, and next-state guidance.
- Inspect but do not hand-edit generated route outputs:
  - `src/client/router/routes.ts`
  - `src/common/router/client-routes.ts`

## Tasks

- [x] Confirm branch, worktree, latest commit, Node version, and pnpm version.
- [x] Read migration status, playbook, inventory, API contract, and completion audit docs.
- [x] Inspect public route builder metadata and generated route metadata.
- [x] Inspect test coverage files for public routes, API service, route builders, generated routes, SSR smoke, and visual/full-chain layout checks.
- [x] Write `docs/migration/final-integration-review.md` with requirement evidence and deferred product decisions.
- [x] Update `docs/migration/status.md` to reference final integration review.
- [x] Run `corepack pnpm run gen:client-router`.
- [x] Confirm generated route files have no unexpected diff.
- [x] Run `corepack pnpm test:migration`.
- [x] Run `git diff --check`.
- [x] Mark this plan complete.
- [x] Commit the final review slice with a Chinese Conventional Commit message.
