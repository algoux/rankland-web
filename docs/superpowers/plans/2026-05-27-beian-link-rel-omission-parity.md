# Beian Link Rel Omission Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React omitted-`rel` DOM parity for conditional beian links on Home and the shared SRK footer.

**Architecture:** Keep the existing Vue conditional rendering and environment helpers. Add a focused full-chain spec gated by `RANKLAND_SITE_ALIAS=cnn` / `SITE_ALIAS=cnn`, then remove only the Vue-added `rel="noreferrer"` attributes from the scoped beian anchors.

**Tech Stack:** Vue 3, Playwright full-chain E2E, RankLand migration docs.

---

## File ownership

- `src/client/modules/home/home.view.vue`
- `src/client/components/rankland-ranklist.vue`
- `tests/e2e/full-chain/beian.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-beian-link-rel-omission-parity-design.md`
- `docs/superpowers/plans/2026-05-27-beian-link-rel-omission-parity.md`

## Tasks

- [x] Create the design spec for beian link `rel` omission parity.
- [x] Add conditional full-chain assertions for Home and SRK footer beian links to keep `target="_blank"` and omit `rel`.
- [x] Run the focused beian full-chain spec with `RANKLAND_SITE_ALIAS=cnn` and confirm RED.
- [x] Remove Vue-added `rel="noreferrer"` from the scoped beian links.
- [x] Run the focused beian full-chain spec with `RANKLAND_SITE_ALIAS=cnn` and confirm GREEN.
- [x] Update migration status and acceptance docs with verified beian link rel omission parity.
- [x] Run `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
- [x] Commit the slice with a Chinese Conventional Commit message.

## Verification commands

```bash
RANKLAND_SITE_ALIAS=cnn BEIAN=鲁ICP备00000000号 corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/beian.spec.ts
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```
