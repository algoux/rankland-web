# Playground Docs Link Anchor Class Parity Implementation Plan

> Spec: `docs/superpowers/specs/2026-05-27-playground-docs-link-anchor-class-parity-design.md`

**Goal:** Restore old React plain-anchor parity for the Playground preview-pane srk docs link.

**Architecture:** Keep the restored wrapper DOM and all link semantics. Add a focused full-chain assertion that the docs anchor has no class, then remove the migration-only class and its scoped style rule.

**Tech Stack:** Vue 3, Ant Design Vue, Playwright full-chain E2E, RankLand migration docs.

## File ownership

- `src/client/modules/playground/playground.view.vue`
- `tests/e2e/full-chain/playground.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-playground-docs-link-anchor-class-parity-design.md`
- `docs/superpowers/plans/2026-05-27-playground-docs-link-anchor-class-parity.md`

## Tasks

- [x] Create this design spec and implementation plan.
- [x] Add full-chain no-class assertion for `[data-id="playground-docs-link"]`.
- [x] Run the focused Playground full-chain test and confirm RED.
- [x] Remove `playground-docs-link` from the anchor template and delete the scoped style rule.
- [x] Run the focused Playground full-chain test and confirm GREEN.
- [x] Update migration status, acceptance checklist, and final integration review docs.
- [x] Run `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
- [x] Commit the slice with a Chinese Conventional Commit message.

## Verification commands

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts -g "hydrates the CSR playground"
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```
