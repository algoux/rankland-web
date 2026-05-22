# App Shell Theme Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore legacy app-shell system theme synchronization and macOS Blink optimization behavior in Vue.

**Architecture:** Add client-only side effects to `src/client/App.vue`, keep SSR untouched, add minimal global theme/optimization CSS, and verify through full-chain Playwright.

**Tech Stack:** Vue 3 options API, browser `matchMedia`, Playwright full-chain E2E, Less.

---

## File Structure

- Modify `src/client/App.vue`: theme media query listener, cleanup, and user-agent optimization class.
- Modify `src/client/index.less`: dark/light app shell colors and optimized SRK table CSS variables.
- Modify `tests/e2e/full-chain/app-shell.spec.ts`: full-chain theme/optimization coverage.
- Modify `docs/migration/status.md`: record verified slice and remaining risks.

## Tasks

- [x] Add failing app-shell full-chain tests for dark mode, runtime light switch, and macOS Blink optimization class.
- [x] Run the focused app-shell spec and confirm the theme assertions fail.
- [x] Implement client-only theme synchronization in `App.vue`.
- [x] Add global light/dark and optimize-decrease-effects styles in `index.less`.
- [x] Run the focused app-shell full-chain spec and fix failures.
- [x] Run `corepack pnpm run build:client`.
- [x] Update this checklist and `docs/migration/status.md`.
- [x] Run `git diff --check`.
- [x] Commit with a Chinese Conventional Commit message.
