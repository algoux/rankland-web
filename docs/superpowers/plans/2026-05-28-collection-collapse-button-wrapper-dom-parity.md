# Collection Collapse Button Wrapper DOM Parity Plan

## Scope

Restore old React `/collection/:id` nav collapse button wrapper DOM parity.

## Steps

1. Add a full-chain DOM helper in `tests/e2e/full-chain/collection.spec.ts`:
   - `[data-id="collection-nav"]` first direct child is `DIV`.
   - The first child has an empty class list and no inline style.
   - `[data-id="collection-collapse-button"]` parent is that plain `DIV`.
2. Run the focused collection menu test and confirm RED:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders the legacy Ant Design collection menu with category icons"
```

3. Update `src/client/modules/collection/collection.view.vue`:
   - Wrap the collapse `a-button` in a plain `div`.
   - Keep the button `data-id`, class, size, style, click handler, and children unchanged.
4. Run focused GREEN:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders the legacy Ant Design collection menu with category icons"
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

7. Commit as `fix: 还原 Collection 折叠按钮包裹层`.

## Files

- `src/client/modules/collection/collection.view.vue`
- `tests/e2e/full-chain/collection.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-28-collection-collapse-button-wrapper-dom-parity-design.md`
- `docs/superpowers/plans/2026-05-28-collection-collapse-button-wrapper-dom-parity.md`
