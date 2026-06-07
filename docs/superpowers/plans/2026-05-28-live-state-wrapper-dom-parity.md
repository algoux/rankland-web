# Live State Wrapper DOM Parity Plan

## Scope

Restore old React `/live/:id` state wrapper DOM parity for loading, NotFound, and generic error states.

## Steps

1. Add full-chain assertions in `tests/e2e/full-chain/live.spec.ts`:
   - NotFound and generic error wrappers are `DIV` with exact classes `mt-16 text-center`.
   - Loading wrapper is `DIV` with exact classes `mt-16 text-center`.
   - Loading wrapper contains an Ant Design Spin child and is not itself `.ant-spin`.
   - No wrapper emits the Vue-only `live-state` class.
2. Run the focused live state tests and confirm RED.
3. Update `src/client/modules/live/live.view.vue`:
   - render NotFound/error wrappers as `div`;
   - wrap loading `a-spin` in a `div data-id="live-loading" class="mt-16 text-center"`;
   - remove unused `.live-state` scoped CSS.
4. Run the focused live state tests and confirm GREEN.
5. Run a focused normal live bounds test to guard loaded route behavior.
6. Update migration docs:
   - `docs/migration/status.md`
   - `docs/migration/manual-acceptance-checklist.md`
   - `docs/migration/final-integration-review.md`
7. Run the full migration gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

8. Commit as `fix: 还原 Live 状态外壳 DOM`.

## Files

- `src/client/modules/live/live.view.vue`
- `tests/e2e/full-chain/live.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-28-live-state-wrapper-dom-parity-design.md`
- `docs/superpowers/plans/2026-05-28-live-state-wrapper-dom-parity.md`
