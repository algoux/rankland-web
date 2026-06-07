# Collection Menu Leaf Anchor DOM Parity Plan

## Scope

Restore old React `/collection/:id` menu leaf label anchor DOM parity.

## Steps

1. Add a full-chain DOM helper in `tests/e2e/full-chain/collection.spec.ts`:
   - ranklist leaf `[data-id="collection-menu-item-test-key"]` is `A`;
   - its `href` ends with `/collection/official?rankId=test-key`;
   - it has no `role` or `aria-current`;
   - directory `[data-id="collection-menu-item-dir-icpc"]` remains `SPAN`.
2. Run the focused collection menu test and confirm RED:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders the legacy Ant Design collection menu with category icons"
```

3. Update `src/client/modules/collection/collection.view.vue`:
   - render ranklist leaf labels as `a` VNodes;
   - set `href` with `ranklandRoutes.collection.build({ id: this.id, rankId: item.uniqueKey })`;
   - call `preventDefault()` on the anchor click;
   - keep `data-id` and `data-collection-key`.
4. Run focused GREEN:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders the legacy Ant Design collection menu with category icons"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "uses the legacy mobile nav collapse behavior"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "keeps the collection page wrappers within desktop and mobile viewport bounds"
```

5. Update migration docs:
   - `docs/migration/status.md`
   - `docs/migration/manual-acceptance-checklist.md`
   - `docs/migration/final-integration-review.md`
6. Run the full migration gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

7. Commit as `fix: 还原 Collection 菜单叶子链接 DOM`.

## Files

- `src/client/modules/collection/collection.view.vue`
- `tests/e2e/full-chain/collection.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-28-collection-menu-leaf-anchor-dom-parity-design.md`
- `docs/superpowers/plans/2026-05-28-collection-menu-leaf-anchor-dom-parity.md`
