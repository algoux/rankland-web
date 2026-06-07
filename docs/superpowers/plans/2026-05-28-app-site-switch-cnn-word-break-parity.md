# App Site Switch CNN Word-Break Parity Plan

## Scope

Restore old React branch-specific word-break behavior for the App shell site-switch link.

## Steps

1. Add a unit/source guard under `tests/unit` that fails while the site-switch anchor has unconditional `style="word-break: keep-all;"`.
2. Run the focused unit test and confirm RED.
3. Update `src/client/App.vue`:
   - replace the hard-coded anchor style with `:style="siteSwitchLinkStyle"`;
   - add computed `siteSwitchLinkStyle` that returns `undefined` for `siteAlias === 'cnn'`, otherwise `{ wordBreak: 'keep-all' }`.
4. Run the focused unit test and the existing focused app-shell full-chain shell test.
5. Update migration docs with the new branch-specific coverage.
6. Run the full migration gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

7. Commit the slice as `fix: 还原站点切换全球分支换行样式`.

## Files

- `src/client/App.vue`
- `tests/unit/app-site-switch.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-28-app-site-switch-cnn-word-break-parity-design.md`
- `docs/superpowers/plans/2026-05-28-app-site-switch-cnn-word-break-parity.md`
