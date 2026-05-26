# Home Legacy Block DOM Parity Plan

## Commit

`fix: 还原首页旧版区块节点`

## Tasks

- [x] Add a full-chain assertion for the five old `div.block` home content groups.
- [x] Run the focused home full-chain test and confirm RED.
- [x] Change migrated Vue home content groups from `section.home-section` to `div.block.home-section`.
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
- `docs/superpowers/specs/2026-05-27-home-block-dom-parity-design.md`
- `docs/superpowers/plans/2026-05-27-home-block-dom-parity.md`

## Verification Notes

Use the full-chain harness because this contract depends on SSR output, hydration, and the real page DOM.
