# Ranklist Header Meta Text Color Parity Plan

## Slice

Restore old Ant Design light/dark inherited text color for non-link metadata in the shared ranklist header.

## Files

- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `src/client/index.less`
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Add: `docs/superpowers/specs/2026-05-26-ranklist-header-meta-text-color-parity-design.md`
- Add: `docs/superpowers/plans/2026-05-26-ranklist-header-meta-text-color-parity.md`

## Tasks

- [x] Compare old React header metadata and old Ant Design light/dark body colors.
- [x] Write this spec and plan.
- [x] Add RED full-chain assertions for old inherited metadata text colors.
- [x] Run focused ranklist full-chain tests and confirm the expected slate-color mismatch.
- [x] Add theme variables for old Ant Design body text color.
- [x] Point ranklist header metadata/time text to the old text-color variable.
- [x] Run focused full-chain tests and confirm GREEN.
- [x] Run the full ranklist full-chain spec.
- [x] Stabilize the existing organization-filter full-chain helper by waiting for the selected count before checking filtered rows.
- [x] Update migration docs with this verified parity slice.
- [x] Run final gates:

```bash
node -v
corepack pnpm -v
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

- [x] Commit:

```bash
git add tests/e2e/full-chain/ranklist.spec.ts src/client/index.less src/client/components/rankland-ranklist.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-26-ranklist-header-meta-text-color-parity-design.md docs/superpowers/plans/2026-05-26-ranklist-header-meta-text-color-parity.md
git commit -m "fix: 还原榜单头部元信息文字颜色"
```
