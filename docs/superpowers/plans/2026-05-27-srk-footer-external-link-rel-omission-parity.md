# SRK Footer External Link Rel Omission Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React omitted-`rel` DOM parity for SRK footer package/project external links.

**Architecture:** Keep the existing Vue footer rendering and footer site state. Add full-chain assertions for the three old footer external anchors, then remove only their Vue-added `rel="noreferrer"` attributes while leaving beian and ContactUs paths unchanged.

**Tech Stack:** Vue 3, Playwright full-chain E2E, RankLand migration docs.

---

## File ownership

- `src/client/components/rankland-ranklist.vue`
- `tests/e2e/full-chain/ranklist.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-srk-footer-external-link-rel-omission-parity-design.md`
- `docs/superpowers/plans/2026-05-27-srk-footer-external-link-rel-omission-parity.md`

## Tasks

- [x] Create the design spec for SRK footer external link `rel` omission parity.
- [x] Add full-chain assertions for the three footer package/project links to keep `target="_blank"` and omit `rel`.
- [x] Run the focused ranklist full-chain test and confirm RED.
- [x] Remove Vue-added `rel="noreferrer"` from the three footer package/project links.
- [x] Run the focused ranklist full-chain test and confirm GREEN.
- [x] Update migration status and acceptance docs with verified footer external link rel omission parity.
- [x] Run `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
- [x] Commit the slice with a Chinese Conventional Commit message.

## Verification commands

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```
