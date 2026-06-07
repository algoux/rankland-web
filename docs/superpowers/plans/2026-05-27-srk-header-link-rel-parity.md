# SRK Header Ref-Link Rel Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `rel="noopener"` DOM parity for SRK header reference links.

**Architecture:** Keep the existing Vue header rendering and link data mapping. Change only the `rel` attributes on visible reference-link and hidden reference-link anchors from `noreferrer` to `noopener`.

**Tech Stack:** Vue 3, ant-design-vue, Playwright full-chain E2E, RankLand migration docs.

---

## File ownership

- `src/client/components/rankland-ranklist.vue`
- `tests/e2e/full-chain/ranklist.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-srk-header-link-rel-parity-design.md`
- `docs/superpowers/plans/2026-05-27-srk-header-link-rel-parity.md`

## Tasks

- [x] Create the design spec for SRK header link `rel` parity.
- [x] Add full-chain assertions for visible ref-link and hidden ref-link `rel="noopener"`.
- [x] Run the focused ranklist full-chain test and confirm RED.
- [x] Change Vue SRK header ref-link anchors to `rel="noopener"`.
- [x] Run the focused ranklist full-chain test and confirm GREEN.
- [x] Update migration status and acceptance docs with verified header link rel parity.
- [x] Run `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
- [x] Commit the slice with a Chinese Conventional Commit message.

## Verification commands

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```
