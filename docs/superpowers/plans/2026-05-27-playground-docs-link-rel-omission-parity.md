# Playground Docs Link Rel Omission Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React omitted-`rel` DOM parity for the Playground preview-pane srk docs link.

**Architecture:** Keep the existing Playground view, Monaco integration, preview rendering, and docs-link placement. Add full-chain assertions to the existing Playground route test, then remove only the Vue-added `rel="noreferrer"` attribute from the scoped docs anchor.

**Tech Stack:** Vue 3, Ant Design Vue, Playwright full-chain E2E, RankLand migration docs.

---

## File ownership

- `src/client/modules/playground/playground.view.vue`
- `tests/e2e/full-chain/playground.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-playground-docs-link-rel-omission-parity-design.md`
- `docs/superpowers/plans/2026-05-27-playground-docs-link-rel-omission-parity.md`

## Tasks

- [x] Create the design spec for Playground docs link `rel` omission parity.
- [x] Add full-chain assertions for the docs link to keep `target="_blank"` and omit `rel`.
- [x] Run the focused Playground full-chain test and confirm RED.
- [x] Remove Vue-added `rel="noreferrer"` from the scoped Playground docs link.
- [x] Run the focused Playground full-chain test and confirm GREEN.
- [x] Update migration status and acceptance docs with verified Playground docs link rel omission parity.
- [x] Run `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
- [x] Commit the slice with a Chinese Conventional Commit message.

## Verification commands

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts -g "hydrates the CSR playground"
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```
