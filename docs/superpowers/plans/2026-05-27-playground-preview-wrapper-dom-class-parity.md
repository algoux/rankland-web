# Playground Preview Wrapper DOM/Class Parity Implementation Plan

> Spec: `docs/superpowers/specs/2026-05-27-playground-preview-wrapper-dom-class-parity-design.md`

**Goal:** Restore old React `div.mt-8.mb-8` DOM/class parity for the Playground valid SRK preview wrapper.

**Architecture:** Keep the existing preview data flow and `data-id` hook. Add full-chain assertions for the wrapper tag and exact class string, then replace the Vue-only `section.playground-preview` wrapper with the old utility-class `div`.

**Tech Stack:** Vue 3, Ant Design Vue, Playwright full-chain E2E, RankLand migration docs.

## File ownership

- `src/client/modules/playground/playground.view.vue`
- `tests/e2e/full-chain/playground.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-playground-preview-wrapper-dom-class-parity-design.md`
- `docs/superpowers/plans/2026-05-27-playground-preview-wrapper-dom-class-parity.md`

## Tasks

- [x] Create this design spec and implementation plan.
- [x] Add focused full-chain assertions for preview wrapper `div.mt-8.mb-8`.
- [x] Run the focused Playground full-chain test and confirm RED.
- [x] Replace `section.playground-preview` with `div.mt-8.mb-8` and move spacing to utility rules.
- [x] Run the focused Playground full-chain test and confirm GREEN.
- [x] Update migration status, acceptance checklist, and final integration review docs.
- [x] Run `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
- [x] Commit the slice with a Chinese Conventional Commit message.

## Verification commands

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts -g "hydrates the CSR playground"
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```
