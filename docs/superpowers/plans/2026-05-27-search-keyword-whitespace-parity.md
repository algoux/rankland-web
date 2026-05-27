# Search keyword whitespace parity plan

## Slice

Restore old React `/search` keyword whitespace behavior by preserving string query/input values exactly until they reach Fuse and route building.

## Steps

1. Update `tests/unit/search-result.spec.ts`:
   - `normalizeSearchKeyword('  contest  ')` should return `'  contest  '`.
   - Add coverage that whitespace-only keywords are passed to Fuse instead of being treated as empty.
2. Update `tests/e2e/full-chain/search.spec.ts`:
   - Add a direct `/search?kw=%20%20%20` assertion for input value, result-state rendering, `data-result-count`, and no recent state.
   - Add a submit assertion that ` Test 2024 ` is preserved in the URL query.
3. Run focused RED:
   - `corepack pnpm exec vitest run tests/unit/search-result.spec.ts --passWithNoTests`
   - `corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "preserves legacy keyword whitespace"`
4. Update `src/client/modules/search/search-result.ts` and `src/client/modules/search/search.view.vue`:
   - Preserve string query values exactly.
   - Treat only the exact empty string as empty.
   - Build submitted search routes from the untrimmed input value.
5. Run focused GREEN with the same commands.
6. Update migration tracking docs:
   - `docs/migration/status.md`
   - `docs/migration/manual-acceptance-checklist.md`
   - `docs/migration/final-integration-review.md`
7. Run the full migration gate:
   - `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`
8. Commit with:
   - `fix: 还原搜索关键词空白语义`
9. Run post-checks:
   - `git status --short --branch`
   - `git show --check --oneline HEAD`
   - `git diff --check`
