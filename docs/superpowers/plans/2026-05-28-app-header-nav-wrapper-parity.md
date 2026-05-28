# App Header Nav Wrapper Parity Plan

## Scope

Restore old React App shell navigation wrapper DOM/style parity without changing menu behavior.

## Steps

1. Add app-shell full-chain assertions for the old header middle wrapper:
   - direct child order under `.app-header-inner`;
   - second child is a `DIV`;
   - wrapper computes `flex: 1 1 0%` and `min-width: 0px`;
   - wrapper contains `[data-id="app-nav"]`;
   - `[data-id="app-nav"]` is not a direct child of `.app-header-inner`.
2. Run the focused app-shell full-chain test and confirm RED.
3. Update `src/client/App.vue` to wrap the existing `ClientOnly` menu with a plain `div` using inline `flex: 1; min-width: 0;`.
4. Run the focused app-shell full-chain test and confirm GREEN.
5. Run a focused app-shell/mobile bounds test if the first focused test does not cover layout metrics sufficiently.
6. Update migration docs with the verified wrapper contract.
7. Run the full migration gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

8. Commit as `fix: 还原 App 头部导航弹性包裹层`.

## Files

- `src/client/App.vue`
- `tests/e2e/full-chain/app-shell.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-28-app-header-nav-wrapper-parity-design.md`
- `docs/superpowers/plans/2026-05-28-app-header-nav-wrapper-parity.md`
