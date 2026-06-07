# Collection State Wrapper DOM Parity Plan

## Scope

Restore old React `/collection/:id` state wrapper DOM parity for collection-level loading, NotFound, generic error, and selected-ranklist error/loading states.

## Steps

1. Add full-chain assertions in `tests/e2e/full-chain/collection.spec.ts`:
   - Collection NotFound, collection generic error, and selected-ranklist error wrappers are `DIV` with exact classes `pt-16 text-center`.
   - They do not emit Vue-only `collection-state`.
2. Update `tests/unit/collection-loading.spec.ts`:
   - Collection loading source contains `div v-else-if="!collection" data-id="collection-loading" class="pt-16 text-center"`.
   - Collection loading source contains an `<a-spin />` child.
   - Source does not contain `collection-state`.
3. Update `tests/unit/collection-ranklist-loading.spec.ts`:
   - Selected-ranklist switching loading source contains `div v-else-if="isRanklistSwitching" data-id="collection-ranklist-loading" class="pt-16 text-center"`.
   - Selected-ranklist switching loading source contains an `<a-spin />` child.
   - Source does not contain `collection-state`.
4. Run the focused tests and confirm RED.
5. Update `src/client/modules/collection/collection.view.vue`:
   - render collection-level NotFound/error wrappers as `div`;
   - wrap collection-level loading `a-spin` in a `div data-id="collection-loading" class="pt-16 text-center"`;
   - render selected-ranklist error as a plain `div.pt-16.text-center`;
   - wrap selected-ranklist loading `a-spin` in a `div data-id="collection-ranklist-loading" class="pt-16 text-center"`;
   - remove unused `.collection-state` scoped CSS.
6. Run focused GREEN:

```bash
corepack pnpm exec vitest run tests/unit/collection-loading.spec.ts tests/unit/collection-ranklist-loading.spec.ts
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "selected ranklist error state|collection not found|collection load error state"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "keeps the collection page wrappers within desktop and mobile viewport bounds"
```

7. Update migration docs:
   - `docs/migration/status.md`
   - `docs/migration/manual-acceptance-checklist.md`
   - `docs/migration/final-integration-review.md`
8. Run the full migration gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

9. Commit as `fix: 还原 Collection 状态外壳 DOM`.

## Files

- `src/client/modules/collection/collection.view.vue`
- `tests/e2e/full-chain/collection.spec.ts`
- `tests/unit/collection-loading.spec.ts`
- `tests/unit/collection-ranklist-loading.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-28-collection-state-wrapper-dom-parity-design.md`
- `docs/superpowers/plans/2026-05-28-collection-state-wrapper-dom-parity.md`
