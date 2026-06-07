# Migration Completion Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit the current RankLand Vue migration state, run broad gates, and update migration docs with verified evidence and deferred product decisions.

**Architecture:** Keep this as a documentation and verification slice. Use existing route metadata, generated route outputs, migration docs, and test suites as evidence; do not change production code unless a gate exposes a concrete defect.

**Tech Stack:** Vue 3, bwcx, vite-ssr, Vitest, Playwright, full-chain mock backend, Node 24, pnpm 8.

---

## File Structure

- Create `docs/superpowers/specs/2026-05-23-migration-completion-audit-design.md`: audit scope, non-goals, acceptance criteria.
- Create or update `docs/superpowers/plans/2026-05-23-migration-completion-audit.md`: execution checklist and verification evidence.
- Modify `docs/migration/status.md`: current focus, route/dashboard status, open decisions, known risks, and final gate evidence.
- Modify `scripts/client-routes.gen.js`: keep one-shot generation as the default and enter watch mode only with `--watch`.
- Modify `package.json`: keep `gen:client-router` one-shot and route `dev` through `gen:client-router:watch`.
- Inspect generated files only after `corepack pnpm run gen:client-router`:
  - `src/client/router/routes.ts`
  - `src/common/router/client-routes.ts`

## Tasks

- [x] Read migration playbook, status dashboard, inventory, API contract, package scripts, route metadata, and recent commits.
- [x] Confirm Node and pnpm versions with `node -v` and `corepack pnpm -v`.
- [x] Run `corepack pnpm run gen:client-router`; root cause a hang because the script always entered watch mode after generation.
- [x] Split the route generator into one-shot and explicit watch scripts so migration verification can run the documented command and `dev` still watches route files.
- [x] Re-run `corepack pnpm run gen:client-router` and confirm it exits cleanly.
- [x] Inspect `git diff -- src/client/router/routes.ts src/common/router/client-routes.ts` and confirm generated routes did not drift unexpectedly.
- [x] Run broad migration gate: `corepack pnpm test:migration`.
- [x] Confirm `test:migration` passed without requiring failure isolation.
- [x] Update `docs/migration/status.md` with the audit result, broad gate evidence, and deferred product decisions.
- [x] Mark this plan checklist complete for finished tasks.
- [x] Run `git diff --check`.
- [x] Commit the audit and route-generator verification fix with a Chinese Conventional Commit message.
