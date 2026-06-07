# Home Card Paragraph Spacing Parity Plan

## Commit

`fix: 还原首页卡片正文间距`

## Tasks

- [x] Add a full-chain assertion for four old `mt-4 mb-0` home card paragraphs and their computed margins.
- [x] Run the focused home full-chain test and confirm RED.
- [x] Add `mt-4 mb-0` to card paragraphs and restore 16px/0px paragraph margins in scoped CSS.
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
- `docs/superpowers/specs/2026-05-27-home-card-paragraph-spacing-parity-design.md`
- `docs/superpowers/plans/2026-05-27-home-card-paragraph-spacing-parity.md`

## Verification Notes

Use the full-chain harness because this contract depends on the hydrated DOM and final computed styles under Ant Design Vue.
