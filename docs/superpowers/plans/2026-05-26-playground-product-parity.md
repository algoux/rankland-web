# Playground Product Parity Plan

## Scope

Restore the old React Playground one-time welcome modal and move the current preview action/help affordance onto Ant Design Vue components without changing the textarea-based editor architecture.

## File Set

- `tests/e2e/full-chain/playground.spec.ts`
- `src/client/modules/playground/playground.view.vue`
- `src/client/main.ts`
- `docs/migration/status.md`
- `docs/superpowers/specs/2026-05-26-playground-product-parity-design.md`
- `docs/superpowers/plans/2026-05-26-playground-product-parity.md`

## Steps

1. Add full-chain E2E coverage for first-visit welcome modal display, OK persistence, and repeat-visit suppression.
2. Run the focused Playground full-chain test and confirm the new assertion fails for the missing modal.
3. Register the required Ant Design Vue components in `src/client/main.ts`.
4. Update `playground.view.vue` to:
   - check `PlaygroundWelcomeMessageRead` after mount;
   - show a controlled `a-modal` when the key is not `true`;
   - persist `true` on OK;
   - use `a-button` for preview and `a-tag` for the `Ctrl/Cmd + S` shortcut.
5. Run the focused Playground full-chain test and fix only issues required by the slice.
6. Run `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check`.
7. Update `docs/migration/status.md` with the verified slice and remaining Playground risk.
8. Commit the slice with a Chinese Conventional Commit message.

## Verification

Expected commands:

```bash
corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/playground.spec.ts
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

## Non-goals

- Do not add Monaco or CodeMirror dependencies in this slice.
- Do not change SRK parser semantics.
- Do not alter generated route files manually.
