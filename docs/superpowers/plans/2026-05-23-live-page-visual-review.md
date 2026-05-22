# Live Page Visual Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add desktop/mobile screenshot and layout-bound review for normal `/live/:id`.

**Architecture:** Extend the existing live full-chain spec with route-local visual checks. Fix CSS only if assertions expose page-level overflow or out-of-bounds controls.

**Tech Stack:** Playwright full-chain E2E, Vue live route, SRK renderer wrapper, Less.

---

## File Structure

- Modify `tests/e2e/full-chain/live.spec.ts`: normal live page visual review test and local helpers.
- Modify `src/client/modules/live/live.view.vue`: only if the visual test exposes route-level layout issues.
- Modify `src/client/components/rankland-ranklist.vue`: only if the visual test exposes shared wrapper layout issues.
- Modify `docs/migration/status.md`: record verified live page visual review and remaining product decisions.

## Tasks

- [x] Add desktop/mobile screenshot and layout-bound coverage for `/live/live-test-key?token=t0`.
- [x] Run focused live full-chain spec.
- [x] Fix route/shared CSS if visual/layout assertions expose overflow or out-of-bounds controls.
- [x] Re-run focused live full-chain spec.
- [x] Update this checklist and `docs/migration/status.md`.
- [x] Run `git diff --check`.
- [x] Commit with a Chinese Conventional Commit message.
