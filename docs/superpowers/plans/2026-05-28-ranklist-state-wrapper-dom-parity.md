# Ranklist State Wrapper DOM Parity Plan

## Scope

Restore old React `/ranklist/:id` state wrapper DOM parity for loading, NotFound, and generic error states.

## Steps

1. Add full-chain assertions in `tests/e2e/full-chain/ranklist.spec.ts`:
   - NotFound and generic error wrappers are `DIV` with exact classes `mt-16 text-center`.
   - They do not emit Vue-only `ranklist-state`.
2. Update `tests/unit/ranklist-loading.spec.ts`:
   - Loading source contains `div v-else-if="!ranklist" data-id="ranklist-loading" class="mt-16 text-center"`.
   - Loading source contains an `<a-spin />` child.
   - Source does not contain `ranklist-state`.
3. Run the focused tests and confirm RED.
4. Update `src/client/modules/ranklist/ranklist.view.vue`:
   - render NotFound/error wrappers as `div`;
   - wrap loading `a-spin` in a `div data-id="ranklist-loading" class="mt-16 text-center"`;
   - remove unused `.ranklist-state` scoped CSS.
5. Run focused GREEN:

```bash
corepack pnpm exec vitest run tests/unit/ranklist-loading.spec.ts
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "Not Found page|ranklist load error state"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "keeps the ranklist page wrappers within desktop and mobile viewport bounds"
```

6. Update migration docs:
   - `docs/migration/status.md`
   - `docs/migration/manual-acceptance-checklist.md`
   - `docs/migration/final-integration-review.md`
7. Run the full migration gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

8. Commit as `fix: 还原 Ranklist 状态外壳 DOM`.

## Files

- `src/client/modules/ranklist/ranklist.view.vue`
- `tests/e2e/full-chain/ranklist.spec.ts`
- `tests/unit/ranklist-loading.spec.ts`
- `docs/migration/status.md`
- `docs/migration/manual-acceptance-checklist.md`
- `docs/migration/final-integration-review.md`
- `docs/superpowers/specs/2026-05-28-ranklist-state-wrapper-dom-parity-design.md`
- `docs/superpowers/plans/2026-05-28-ranklist-state-wrapper-dom-parity.md`
