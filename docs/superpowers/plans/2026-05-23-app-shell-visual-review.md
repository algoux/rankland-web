# App Shell Visual Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Playwright full-chain screenshot and layout-bound checks for the RankLand Vue app shell.

**Architecture:** Extend the existing app-shell full-chain spec with desktop/mobile viewport checks and screenshots. Fix CSS only if the test exposes layout issues.

**Tech Stack:** Playwright full-chain E2E, Vue app shell, Less.

---

## File Structure

- Modify `tests/e2e/full-chain/app-shell.spec.ts`: visual review test and small bounding-box helper.
- Modify `src/client/index.less`: only if the visual test exposes shell layout overflow.
- Modify `docs/migration/status.md`: record verified visual review and screenshot gate.

## Tasks

- [x] Add desktop/mobile screenshot and layout-bound coverage to the app-shell full-chain spec.
- [x] Run the focused app-shell full-chain spec.
- [x] Fix app shell CSS if the new visual/layout assertions expose overflow or out-of-bounds controls.
- [x] Re-run the focused app-shell full-chain spec.
- [x] Update this checklist and `docs/migration/status.md`.
- [x] Run `git diff --check`.
- [x] Commit with a Chinese Conventional Commit message.
