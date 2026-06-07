# SRK Table Wrapper Class Attribute Parity Implementation Plan

> Spec: `docs/superpowers/specs/2026-05-27-srk-table-wrapper-class-attr-parity-design.md`

**Goal:** Restore old React class-attribute behavior for the shared SRK table wrapper.

**Architecture:** Keep the stable `data-id` test hook. Remove the migration-only class token from the rendered class binding so only caller-provided `tableClass` reaches the DOM.

**Tech Stack:** Vue 3, Playwright full-chain E2E, RankLand migration docs.

## File ownership

- `src/client/components/rankland-ranklist.vue`
- `tests/e2e/full-chain/ranklist.spec.ts`
- `tests/e2e/full-chain/live.spec.ts`
- `tests/e2e/full-chain/collection.spec.ts`
- `tests/e2e/full-chain/playground.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-srk-table-wrapper-class-attr-parity-design.md`
- `docs/superpowers/plans/2026-05-27-srk-table-wrapper-class-attr-parity.md`

## Tasks

- [x] Create this design spec and implementation plan.
- [x] Add focused full-chain assertions for table wrapper class attributes.
- [x] Run focused full-chain tests and confirm RED.
- [x] Remove the Vue-only wrapper class while preserving `data-id` and caller `tableClass`.
- [x] Run focused full-chain tests and confirm GREEN.
- [x] Update migration status, acceptance checklist, and final integration review docs.
- [x] Run `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
- [x] Commit the slice with a Chinese Conventional Commit message.

## Verification commands

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders selected ranklist"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts -g "hydrates the CSR playground"
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```
