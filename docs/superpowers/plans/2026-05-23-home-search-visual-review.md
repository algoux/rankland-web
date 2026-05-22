# Home Search Visual Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add desktop/mobile screenshot and layout-bound review for `/` and `/search`.

**Architecture:** Extend the existing home and search full-chain specs with route-local visual checks. Fix CSS only if the new assertions expose overflow or out-of-bounds controls.

**Tech Stack:** Playwright full-chain E2E, Vue route views, Less.

---

## File Structure

- Modify `tests/e2e/full-chain/home.spec.ts`: home visual review test and local helpers.
- Modify `tests/e2e/full-chain/search.spec.ts`: search visual review test and local helpers.
- Modify `src/client/modules/home/home.view.vue`: only if the visual test exposes home layout issues.
- Modify `src/client/modules/search/search.view.vue`: only if the visual test exposes search layout issues.
- Modify `docs/migration/status.md`: record verified home/search visual review and remaining page-review queue.

## Tasks

- [x] Add desktop/mobile screenshot and layout-bound coverage for `/`.
- [x] Add desktop/mobile screenshot and layout-bound coverage for `/search?kw=Test%202024`.
- [x] Run focused home/search full-chain specs.
- [x] Fix route CSS if the visual/layout assertions expose overflow or out-of-bounds controls.
- [x] Re-run focused home/search full-chain specs.
- [x] Update this checklist and `docs/migration/status.md`.
- [x] Run `git diff --check`.
- [x] Commit with a Chinese Conventional Commit message.
