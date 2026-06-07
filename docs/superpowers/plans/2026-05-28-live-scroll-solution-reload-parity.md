# Live Scroll-Solution Reload Parity Plan

## Scope

Restore the old React full-page navigation semantics for the Live scroll-solution toggle while keeping existing query preservation and UI assertions.

## Steps

1. Add a small beforeunload counter helper to `tests/e2e/full-chain/live.spec.ts`.
2. Update the existing scroll-solution disable full-chain test to assert one beforeunload after clicking the toggle.
3. Run the focused Live full-chain test and confirm it fails on the current `$router.replace` implementation.
4. Replace `handleScrollSolutionToggle` in `src/client/modules/live/live.view.vue` with the old 250 ms `URLSearchParams` + `window.location.search` flow.
5. Re-run the focused Live full-chain test.
6. Update migration docs with the completed reload-parity coverage.
7. Run the full migration gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

8. Commit the slice as `fix: 还原 Live 滚动提交开关刷新语义`.

## Files

- `src/client/modules/live/live.view.vue`
- `tests/e2e/full-chain/live.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-28-live-scroll-solution-reload-parity-design.md`
- `docs/superpowers/plans/2026-05-28-live-scroll-solution-reload-parity.md`
