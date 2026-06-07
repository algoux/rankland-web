# App Shell Focus Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the RankLand global Vue app shell and preserve legacy focus-mode shell bypass behavior.

**Architecture:** Implement the cross-route shell in `src/client/App.vue`, keep generated router outputs untouched, and verify behavior through a focused full-chain Playwright spec.

**Tech Stack:** Vue 3 options API, vue-router, vite-ssr, Playwright full-chain E2E.

---

## File Structure

- Modify `src/client/App.vue`: app shell, focus-mode bypass, nav, switch link, back-to-top behavior.
- Modify `src/client/index.less`: global shell/header/nav/back-to-top styling.
- Modify `vite.config.js`: expose legacy and RankLand-prefixed site-switch host env values.
- Modify `tests/unit/vite-config.spec.ts`: assert the host env values are bundled.
- Create `tests/e2e/full-chain/app-shell.spec.ts`: full-chain contract coverage.
- Modify `docs/migration/status.md`: record verified slice and next focus.

## Tasks

- [x] Write a failing full-chain test for normal shell visibility on `/search?kw=Test%202024`.
- [x] Run the focused spec and confirm it fails because the shell does not exist.
- [x] Implement minimal shell behavior in `App.vue`.
- [x] Add scoped global styles in `index.less` for stable desktop/mobile layout.
- [x] Expose site-switch host env values through Vite config and cover them with the existing config test.
- [x] Run the focused full-chain spec and fix failures.
- [x] Run existing home/search full-chain specs as regression coverage for shell interaction.
- [x] Update this checklist and `docs/migration/status.md`.
- [x] Run `git diff --check`.
- [x] Commit with a Chinese Conventional Commit message.
