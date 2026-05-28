# App Site Switch Dropdown Product-Class Parity Plan

## Scope

Bring the migrated Vue app shell's China site-switch dropdown content class contract back to the old React `RightMenu` shape without changing user-visible behavior.

## Steps

1. Update `tests/e2e/full-chain/app-shell.spec.ts` so the menu content helper reads the direct `p.mb-0` children and asserts both Vue-only product classes are absent.
2. Run the focused app-shell full-chain test and confirm it fails for the current extra classes.
3. Remove `app-site-switch-title` and `app-site-switch-subtitle` from `src/client/App.vue`.
4. Move the nowrap/margin/dark presentation CSS in `src/client/index.less` to selectors based on `[data-id="app-site-switch-link"] > p.mb-0`, keeping utility-class semantics intact.
5. Re-run the focused app-shell full-chain test.
6. Update migration status and acceptance docs with the completed parity coverage.
7. Run the full migration gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

8. Commit the slice as `fix: 还原站点切换下拉内容类名`.

## Files

- `src/client/App.vue`
- `src/client/index.less`
- `tests/e2e/full-chain/app-shell.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-28-app-site-switch-dropdown-product-class-parity-design.md`
- `docs/superpowers/plans/2026-05-28-app-site-switch-dropdown-product-class-parity.md`
