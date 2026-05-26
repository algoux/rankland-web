# Collection Ranklist Panel Layout Parity Plan

## Scope

Restore the old React `.srk-collection-ranklist` panel CSS contract in the Vue collection page.

## File Ownership

- `src/client/modules/collection/collection.view.vue`: minimal CSS implementation.
- `tests/e2e/full-chain/collection.spec.ts`: full-chain regression coverage.
- `docs/migration/status.md`: dashboard update after verification.
- `docs/migration/manual-acceptance-checklist.md`: acceptance checklist update after verification.
- `docs/migration/final-integration-review.md`: final review evidence update after verification.

No parallel workers are needed because the slice touches one route file and shared migration docs.

## Steps

1. Add failing full-chain assertions for the collection ranklist panel computed layout CSS.
2. Run the focused collection full-chain test and confirm the expected RED failure.
3. Add `flex: 1` and `position: relative` to `.collection-ranklist-panel`.
4. Re-run the focused collection full-chain test and confirm GREEN.
5. Update migration documentation for the verified slice.
6. Run the full slice gate:
   - `node -v`
   - `corepack pnpm -v`
   - `corepack pnpm run gen:client-router`
   - `corepack pnpm test:migration`
   - `git diff --check`
7. Commit with a Chinese Conventional Commit message.

## Expected Commit

`fix: 还原合集页榜单面板布局`

## Verification Notes

The focused RED/GREEN command should target the existing collection menu/layout test file with a grep matching the updated test. The final gate must run after documentation updates so the committed evidence matches the repository state.
