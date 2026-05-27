# Playground shortcut tag mr-0 class parity plan

## Slice

Restore old React `mr-0` class parity for the `/playground` invalid JSON shortcut tag.

## File ownership

- `src/client/modules/playground/playground.view.vue`
- `tests/e2e/full-chain/playground.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-playground-shortcut-tag-mr0-class-parity-design.md`
- `docs/superpowers/plans/2026-05-27-playground-shortcut-tag-mr0-class-parity.md`

## Tasks

- [x] Add a full-chain assertion that the invalid JSON shortcut tag includes `mr-0`.
- [x] Run the focused invalid JSON full-chain test and confirm RED.
- [x] Restore `mr-0` on the Vue shortcut tag while preserving `.playground-shortcut-tag`.
- [x] Run the focused invalid JSON full-chain test and confirm GREEN.
- [x] Update migration status and acceptance docs with the verified class-token parity.
- [x] Run `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
- [x] Commit the slice with a Chinese Conventional Commit message.

## Verification commands

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts -g "shows invalid JSON state"
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```
