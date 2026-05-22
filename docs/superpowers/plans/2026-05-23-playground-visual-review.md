# Playground Visual Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add desktop/mobile screenshot and layout-bound review for `/playground`.

**Architecture:** Extend the existing playground full-chain spec with route-local visual checks. Fix CSS only if assertions expose page-level overflow or out-of-bounds controls.

**Tech Stack:** Playwright full-chain E2E, Vue route views, SRK renderer wrapper, Less.

---

## File Structure

- Modify `tests/e2e/full-chain/playground.spec.ts`: playground visual review test and local helpers.
- Modify `src/client/modules/playground/playground.view.vue`: only if the visual test exposes layout issues.
- Modify `docs/migration/status.md`: record verified playground visual review and remaining page-review queue.

## Tasks

- [x] Add desktop/mobile screenshot and layout-bound coverage for `/playground`.
- [x] Run focused playground full-chain spec.
- [x] Fix route CSS if visual/layout assertions expose overflow or out-of-bounds controls.
- [x] Re-run focused playground full-chain spec.
- [x] Update this checklist and `docs/migration/status.md`.
- [x] Run `git diff --check`.
- [x] Commit with a Chinese Conventional Commit message.
