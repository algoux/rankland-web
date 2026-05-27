# Fallback 404 Class Token Parity Implementation Plan

> Spec: `docs/superpowers/specs/2026-05-27-fallback-not-found-class-token-parity-design.md`

**Goal:** Restore old React `text-center mt-32 text-xl` class-token parity on the fallback 404 page.

**Architecture:** Keep the stable `data-id` selector and route/status behavior. Replace the migration-only CSS class with old utility tokens and define local scoped utility rules for the same computed layout.

**Tech Stack:** Vue 3, bwcx/vite-ssr fallback route, Playwright full-chain E2E, RankLand migration docs.

## File ownership

- `src/client/modules/fallback/not-found.view.vue`
- `tests/e2e/full-chain/app-shell.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-fallback-not-found-class-token-parity-design.md`
- `docs/superpowers/plans/2026-05-27-fallback-not-found-class-token-parity.md`

## Tasks

- [x] Create this design spec and implementation plan.
- [x] Add the full-chain class-token assertion.
- [x] Run the focused fallback 404 test and confirm RED.
- [x] Replace the migration-only class with old class tokens and scoped utility rules.
- [x] Run the focused fallback 404 test and confirm GREEN.
- [x] Update migration status, acceptance checklist, and final integration review docs.
- [x] Run `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
- [x] Commit the slice with a Chinese Conventional Commit message.

## Verification commands

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/app-shell.spec.ts -g "renders the legacy fallback 404 copy"
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```
