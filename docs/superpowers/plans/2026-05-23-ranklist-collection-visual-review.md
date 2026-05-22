# Ranklist Collection Visual Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add desktop/mobile screenshot and layout-bound review for `/ranklist/:id` and `/collection/:id`.

**Architecture:** Extend existing full-chain specs with route-local visual checks. Fix CSS only if the new assertions expose page-level overflow or out-of-bounds controls.

**Tech Stack:** Playwright full-chain E2E, Vue route views, SRK renderer wrapper, Less.

---

## File Structure

- Modify `tests/e2e/full-chain/ranklist.spec.ts`: ranklist visual review test and local helpers.
- Modify `tests/e2e/full-chain/collection.spec.ts`: collection visual review test and local helpers.
- Modify `src/client/components/rankland-ranklist.vue`: only if the visual test exposes wrapper-level layout issues.
- Modify `src/client/modules/collection/collection.view.vue`: only if the visual test exposes collection layout issues.
- Modify `docs/migration/status.md`: record verified ranklist/collection visual review and remaining page-review queue.

## Tasks

- [x] Add desktop/mobile screenshot and layout-bound coverage for `/ranklist/test-key?focus=yes`.
- [x] Add desktop/mobile screenshot and layout-bound coverage for `/collection/official?rankId=test-key`.
- [x] Run focused ranklist/collection full-chain specs.
- [x] Fix route CSS if the visual/layout assertions expose overflow or out-of-bounds controls.
- [x] Re-run focused ranklist/collection full-chain specs.
- [x] Update this checklist and `docs/migration/status.md`.
- [x] Run `git diff --check`.
- [x] Commit with a Chinese Conventional Commit message.
