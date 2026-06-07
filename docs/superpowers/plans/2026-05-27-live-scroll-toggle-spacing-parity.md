# Live Scroll Toggle Spacing Parity Plan

## Scope

Restore the old React live scroll-solution toggle spacing in the Vue live route.

## File Ownership

- `src/client/modules/live/live.view.vue`: minimal CSS implementation.
- `tests/e2e/full-chain/live.spec.ts`: full-chain regression assertion.
- `docs/migration/status.md`: dashboard update after verification.
- `docs/migration/manual-acceptance-checklist.md`: acceptance checklist update after verification.
- `docs/migration/final-integration-review.md`: final review evidence update after verification.

No parallel workers are needed because this is a narrow route-polish slice.

## Steps

1. Add a failing full-chain assertion for `.live-scroll-toggle` computed `column-gap`.
2. Run the focused live full-chain test and confirm the expected RED failure.
3. Change `.live-scroll-toggle` gap to `4px`.
4. Re-run the focused live full-chain test and confirm GREEN.
5. Update migration documentation for the verified slice.
6. Run the full slice gate:
   - `node -v`
   - `corepack pnpm -v`
   - `corepack pnpm run gen:client-router`
   - `corepack pnpm test:migration`
   - `git diff --check`
7. Commit with a Chinese Conventional Commit message.

## Expected Commit

`fix: 还原直播页滚动开关间距`
