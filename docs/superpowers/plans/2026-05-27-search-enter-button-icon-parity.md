# Search Enter Button Icon Parity Implementation Plan

Commit target:

`fix: 还原搜索页默认搜索图标按钮`

## Tasks

- [x] Add the design spec for old React `/search` boolean `enterButton` icon parity.
- [x] Update `/search` full-chain assertions for the default Ant Design search icon button.
- [x] Run the focused `/search` full-chain test and confirm RED for the current custom text button.
- [x] Update `src/client/modules/search/search.view.vue` to use boolean `enter-button` and remove the custom button slot.
- [x] Re-run the focused full-chain test and confirm GREEN.
- [x] Run the full migration gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

- [x] Update `docs/migration/status.md`, `docs/migration/manual-acceptance-checklist.md`, and `docs/migration/final-integration-review.md`.
- [x] Stage the slice files, run `git diff --cached --check`, and commit.
- [x] Confirm the post-commit worktree is clean.

## File Set

- `src/client/modules/search/search.view.vue`
- `tests/e2e/full-chain/search.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-search-enter-button-icon-parity-design.md`
- `docs/superpowers/plans/2026-05-27-search-enter-button-icon-parity.md`
