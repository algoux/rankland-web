# SRK Contributor Item Span DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React item-level `span` DOM parity for visible SRK header contributors.

**Architecture:** Keep the existing Vue contributor data mapping and outer contributor paragraph. Change only the template loop so each contributor item owns its comma prefix and link/text inside one `span`, matching old React `renderContributors`.

**Tech Stack:** Vue 3, ant-design-vue, Playwright full-chain E2E, RankLand migration docs.

---

## File ownership

- `src/client/components/rankland-ranklist.vue`
- `tests/e2e/full-chain/ranklist.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-srk-contributor-item-span-dom-parity-design.md`
- `docs/superpowers/plans/2026-05-27-srk-contributor-item-span-dom-parity.md`

## Tasks

- [x] Create the design spec for contributor item-level `span` DOM parity.
- [x] Add a full-chain assertion that visible SRK contributors are item-level `SPAN` wrappers.
- [x] Run the focused ranklist full-chain test and confirm RED.
- [x] Change the Vue contributor rendering to wrap each item in `span`.
- [x] Run the focused ranklist full-chain test and confirm GREEN.
- [x] Update migration status and acceptance docs with verified contributor item-level DOM parity.
- [x] Run `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
- [x] Commit the slice with a Chinese Conventional Commit message.

## Verification commands

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```
