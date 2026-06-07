# Collection Menu Open Keys Interaction Parity Plan

## Scope

Cover old React `/collection/:id` inline menu open-key interaction parity while preserving selected-ranklist ancestor auto-open.

## Steps

1. Add a full-chain helper/assertion in `tests/e2e/full-chain/collection.spec.ts`:
   - `dir-icpc` starts open for `/collection/official?rankId=test-key`;
   - clicking `dir-icpc` manually closes the selected-path directory;
   - the selected leaf becomes hidden while the route remains selected;
   - the route URL remains on `rankId=test-key`.
2. Run the focused collection menu test:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders the legacy Ant Design collection menu with category icons"
```

3. If the focused test fails because manual submenu state is not preserved, update `src/client/modules/collection/collection.view.vue`:
   - add stateful `menuOpenKeys`;
   - derive selected ancestor keys separately;
   - merge selected ancestor keys into `menuOpenKeys` when collection, `rankId`, or invalid state changes;
   - pass `collapsed ? [] : menuOpenKeys` to `a-menu`;
   - handle `openChange` by replacing `menuOpenKeys` with the emitted keys.
4. If the focused test passes immediately, keep the production code unchanged and treat the slice as regression coverage.
5. Run focused verification:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders the legacy Ant Design collection menu with category icons"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "uses the legacy mobile nav collapse behavior"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "keeps the collection page wrappers within desktop and mobile viewport bounds"
```

6. Update migration docs:
   - `docs/migration/status.md`
   - `docs/migration/manual-acceptance-checklist.md`
   - `docs/migration/final-integration-review.md`
7. Run the full migration gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

8. Commit as `test: 覆盖 Collection 菜单展开交互`.

## Files

- `tests/e2e/full-chain/collection.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-28-collection-menu-open-keys-interaction-parity-design.md`
- `docs/superpowers/plans/2026-05-28-collection-menu-open-keys-interaction-parity.md`
