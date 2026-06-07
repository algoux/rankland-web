# Playground Docs Link Wrapper DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React wrapper DOM parity for the Playground preview-pane srk docs link.

**Architecture:** Keep the existing Playground page, Monaco integration, docs anchor hook, and visual placement. Add full-chain assertions for the old wrapper, then wrap the anchor in `div.absolute.right-4.top-4` and let the wrapper own absolute placement.

**Tech Stack:** Vue 3, Ant Design Vue, Playwright full-chain E2E, RankLand migration docs.

---

## File ownership

- `src/client/modules/playground/playground.view.vue`
- `tests/e2e/full-chain/playground.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-playground-docs-link-wrapper-dom-parity-design.md`
- `docs/superpowers/plans/2026-05-27-playground-docs-link-wrapper-dom-parity.md`

## Tasks

- [x] Create the design spec for Playground docs link wrapper DOM parity.
- [x] Add full-chain assertions for the docs link wrapper `div.absolute.right-4.top-4`.
- [x] Run the focused Playground full-chain test and confirm RED.
- [x] Add the wrapper around the scoped Playground docs link.
- [x] Run the focused Playground full-chain test and confirm GREEN.
- [x] Update migration status and acceptance docs with verified Playground docs link wrapper DOM parity.
- [x] Run `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
- [x] Commit the slice with a Chinese Conventional Commit message.

## Verification commands

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts -g "hydrates the CSR playground"
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```
