# SRK Header Title Typography Parity Implementation Plan

Commit target:

`fix: 还原 SRK 标题字体`

## Tasks

- [x] Add the design spec for old React SRK header title typography parity.
- [x] Add a full-chain assertion for the shared SRK header title computed `32px` font size, `500` font weight, and `4px` bottom margin.
- [x] Run the focused `/ranklist/:id` full-chain test and confirm RED for the current `28px` title font size.
- [x] Update `src/client/components/rankland-ranklist.vue` scoped title CSS to match old React/Ant Design heading typography.
- [x] Re-run the focused full-chain test and confirm GREEN.
- [x] Run the full migration gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

- [x] Update `docs/migration/status.md`, `docs/migration/manual-acceptance-checklist.md`, and `docs/migration/final-integration-review.md`.
- [x] Stage the slice files, run `git diff --cached --check`, and commit.
- [x] Confirm the post-commit worktree is clean.

## File Set

- `src/client/components/rankland-ranklist.vue`
- `tests/e2e/full-chain/ranklist.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-27-srk-header-title-typography-parity-design.md`
- `docs/superpowers/plans/2026-05-27-srk-header-title-typography-parity.md`
