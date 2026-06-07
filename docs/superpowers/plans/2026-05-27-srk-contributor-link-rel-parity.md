# SRK Contributor Link Rel Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `rel="noopener"` DOM parity for SRK header contributor links.

**Architecture:** Keep the existing Vue header contributor rendering and `resolveContributor` mapping. Add one deterministic URL contributor fixture, assert the old anchor attributes through the ranklist full-chain path, then change only the contributor anchor `rel` attribute from `noreferrer` to `noopener`.

**Tech Stack:** Vue 3, `@algoux/standard-ranklist-utils`, Playwright full-chain E2E, RankLand migration docs.

---

## File ownership

- `tests/fixtures/ranklist.srk.json`
- `tests/e2e/full-chain/ranklist.spec.ts`
- `src/client/components/rankland-ranklist.vue`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-srk-contributor-link-rel-parity-design.md`
- `docs/superpowers/plans/2026-05-27-srk-contributor-link-rel-parity.md`

## Tasks

- [x] Create the design spec for SRK contributor link `rel` parity.
- [x] Add a URL contributor fixture and full-chain assertions for contributor `target="_blank"` plus `rel="noopener"`.
- [x] Run the focused ranklist full-chain test and confirm RED.
- [x] Change Vue SRK header contributor anchors to `rel="noopener"`.
- [x] Run the focused ranklist full-chain test and confirm GREEN.
- [x] Update migration status and acceptance docs with verified contributor link rel parity.
- [x] Run `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
- [x] Commit the slice with a Chinese Conventional Commit message.

## Verification commands

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```
