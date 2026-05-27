# Search result count DOM parity plan

## Slice

Bring the Vue `/search` result summary DOM back to the old React structure by removing the Vue-only
`span[data-id="search-result-count"]`.

## Steps

1. Update `tests/e2e/full-chain/search.spec.ts`:
   - In the non-empty query test, assert exact summary text `搜索到 1 个结果`.
   - Assert `[data-id="search-result-count"]` is absent.
   - Keep `data-result-count="1"` on `[data-id="search-result-section"]`.
   - In the zero-result test, assert exact summary text `搜索到 0 个结果`.
   - Assert `[data-id="search-result-count"]` is absent.
   - Keep `data-result-count="0"` on `[data-id="search-result-section"]`.
2. Run focused RED:
   - `corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/search.spec.ts -g "shows Fuse results|renders zero search results"`
3. Update `src/client/modules/search/search.view.vue`:
   - Render `搜索到 {{ searchRows.length }} 个结果` directly in the summary div.
4. Run focused GREEN with the same command.
5. Update migration tracking docs:
   - `docs/migration/status.md`
   - `docs/migration/manual-acceptance-checklist.md`
   - `docs/migration/final-integration-review.md`
6. Run the full migration gate:
   - `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`
7. Commit with:
   - `fix: 还原搜索页结果数 DOM`
8. Run post-checks:
   - `git status --short --branch`
   - `git show --check --oneline HEAD`
   - `git diff --check`
