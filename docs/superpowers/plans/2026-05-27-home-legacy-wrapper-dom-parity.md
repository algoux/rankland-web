# Home Legacy Wrapper DOM Parity Plan

## Commit

`fix: 还原首页旧版内容容器`

## Tasks

- [x] Add a full-chain assertion for old `main.normal-content` and child `.home-intro` DOM shape.
- [x] Run the focused home full-chain test and confirm RED.
- [x] Wrap the migrated Vue home content in `div[data-id="home-intro"].home-intro` and add `normal-content` to `main`.
- [x] Run the focused home full-chain test and confirm GREEN.
- [x] Run the complete home full-chain file.
- [x] Update migration status, manual checklist, and final integration review docs.
- [x] Run the full migration gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

- [x] Stage the slice files, run `git diff --cached --check`, and commit.
- [x] Confirm the post-commit worktree is clean.

## File Set

- `src/client/modules/home/home.view.vue`
- `tests/e2e/full-chain/home.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-home-legacy-wrapper-dom-parity-design.md`
- `docs/superpowers/plans/2026-05-27-home-legacy-wrapper-dom-parity.md`

## Verification Notes

Use the existing full-chain Koa/Vite harness because this DOM contract depends on the actual SSR and hydration output.
