# Contact Us Modal Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the legacy RankLand contact modal on the home page and ranklist footer.

**Architecture:** Add one shared Vue component and one copied legacy asset, then wire the component into the two known old React call sites. Verify through full-chain Playwright tests.

**Tech Stack:** Vue 3 options API, Vite asset imports, Playwright full-chain E2E.

---

## File Structure

- Create `src/client/components/contact-us.vue`: shared contact trigger and modal.
- Copy `rankland-fe/src/assets/rankland_qqgroup.jpg` to `src/client/assets/rankland_qqgroup.jpg`.
- Modify `src/client/modules/home/home.view.vue`: use `ContactUs` for the home contact link.
- Modify `src/client/components/rankland-ranklist.vue`: add renderer footer contact prompt.
- Modify `tests/e2e/full-chain/home.spec.ts`: cover home contact modal.
- Modify `tests/e2e/full-chain/ranklist.spec.ts`: cover ranklist footer contact modal.
- Modify `docs/migration/status.md`: record verified slice and remaining risks.

## Tasks

- [x] Write failing full-chain tests for the home and ranklist contact modal behavior.
- [x] Run the focused home/ranklist full-chain specs and confirm the modal assertions fail.
- [x] Add the shared `ContactUs` Vue component and copy the legacy QQ image.
- [x] Wire `ContactUs` into home and RanklandRanklist footer.
- [x] Run the focused full-chain specs and fix failures.
- [x] Run `corepack pnpm run build:client`.
- [x] Update this checklist and `docs/migration/status.md`.
- [x] Run `git diff --check`.
- [x] Commit with a Chinese Conventional Commit message.
