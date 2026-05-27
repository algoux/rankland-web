# Playground Docs Link Wrapper Class Parity Implementation Plan

> Spec: `docs/superpowers/specs/2026-05-27-playground-docs-link-wrapper-class-parity-design.md`

**Goal:** Restore exact old React class-token parity for the Playground preview-pane srk docs link wrapper.

**Architecture:** Keep the existing wrapper DOM and anchor behavior. Add a focused full-chain assertion for the exact wrapper class string, then remove the migration-only wrapper class and target the old class combination from scoped CSS.

**Tech Stack:** Vue 3, Ant Design Vue, Playwright full-chain E2E, RankLand migration docs.

## File ownership

- `src/client/modules/playground/playground.view.vue`
- `tests/e2e/full-chain/playground.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-playground-docs-link-wrapper-class-parity-design.md`
- `docs/superpowers/plans/2026-05-27-playground-docs-link-wrapper-class-parity.md`

## Tasks

- [x] Create this design spec and implementation plan.
- [x] Add full-chain exact class assertion for `div.absolute.right-4.top-4`.
- [x] Run the focused Playground full-chain test and confirm RED.
- [x] Remove `playground-docs-link-wrapper` from the wrapper template and retarget scoped placement CSS.
- [x] Run the focused Playground full-chain test and confirm GREEN.
- [x] Update migration status, acceptance checklist, and final integration review docs.
- [x] Run `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
- [x] Commit the slice with a Chinese Conventional Commit message.

## Verification commands

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts -g "hydrates the CSR playground"
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```
