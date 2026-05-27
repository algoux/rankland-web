# Home External Link Rel Omission Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React omitted-`rel` DOM parity for the default visible home external links.

**Architecture:** Keep the existing Vue home rendering, SSR data path, Ant Design Vue cards, and external href targets. Add full-chain assertions for the old default home external anchors, then remove only their Vue-added `rel="noreferrer"` attributes.

**Tech Stack:** Vue 3, Playwright full-chain E2E, RankLand migration docs.

---

## File ownership

- `src/client/modules/home/home.view.vue`
- `tests/e2e/full-chain/home.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-home-external-link-rel-omission-parity-design.md`
- `docs/superpowers/plans/2026-05-27-home-external-link-rel-omission-parity.md`

## Tasks

- [x] Create the design spec for Home external link `rel` omission parity.
- [x] Add full-chain assertions for default visible home external links to keep `target="_blank"` and omit `rel`.
- [x] Run the focused home full-chain test and confirm RED.
- [x] Remove Vue-added `rel="noreferrer"` from the scoped default visible home external links.
- [x] Run the focused home full-chain test and confirm GREEN.
- [x] Update migration status and acceptance docs with verified Home external link rel omission parity.
- [x] Run `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
- [x] Commit the slice with a Chinese Conventional Commit message.

## Verification commands

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts -g "renders the RankLand home page"
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```
