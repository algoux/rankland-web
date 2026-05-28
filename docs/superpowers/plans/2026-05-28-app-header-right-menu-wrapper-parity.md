# App Header Right Menu Wrapper Parity Plan

## Scope

Restore old React App shell right-menu wrapper DOM parity without changing the site-switch behavior.

## Steps

1. Add app-shell full-chain assertions for the old right-menu wrapper:
   - `.app-header-inner` direct child tags are `A`, `DIV`, `DIV`;
   - the third child is a plain `DIV` with no class and no inline style;
   - it contains `[data-id="app-site-switch"]`;
   - `[data-id="app-site-switch"]` is not a direct child of `.app-header-inner`.
2. Run the focused app-shell full-chain test and confirm RED.
3. Update `src/client/App.vue` to wrap the existing `<a-dropdown>` with a plain `div`.
4. Run the focused app-shell full-chain test and confirm GREEN.
5. Run the focused app-shell desktop/mobile bounds test.
6. Update migration docs with the verified right-menu wrapper contract.
7. Run the full migration gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

8. Commit as `fix: 还原 App 头部右侧菜单包裹层`.

## Files

- `src/client/App.vue`
- `tests/e2e/full-chain/app-shell.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-28-app-header-right-menu-wrapper-parity-design.md`
- `docs/superpowers/plans/2026-05-28-app-header-right-menu-wrapper-parity.md`
