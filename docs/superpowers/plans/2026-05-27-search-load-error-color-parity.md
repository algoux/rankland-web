# Search Load Error Color Parity Implementation Plan

Commit target:

`fix: 还原搜索页加载错误颜色`

## Tasks

- [x] Add the design spec for old React `/search` load error color parity.
- [x] Add a full-chain assertion for the search load error message, spacing, and old `text-red-500` computed color.
- [x] Run the focused `/search` full-chain test and confirm RED for the current custom error color.
- [x] Update `src/client/modules/search/search.view.vue` scoped CSS to restore the old `#ef4444` error color.
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
- `docs/superpowers/specs/2026-05-27-search-load-error-color-parity-design.md`
- `docs/superpowers/plans/2026-05-27-search-load-error-color-parity.md`
