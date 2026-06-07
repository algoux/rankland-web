# Search keyword whitespace parity

## Context

The old React `/search` page reads `kw` through `extractQueryParams(location.query)` and passes it through unchanged:

```tsx
const { kw } = extractQueryParams(location.query);

const onSearch = (value: string) => {
  history.push(formatUrl('Search', { kw: value }));
};

const rows = fuse.search(kw).map((item) => item.item);
```

The current Vue page trims search keywords in three places:

- `normalizeSearchKeyword()` trims the route query before the page state sees it.
- `searchRanklists()` trims before calling Fuse.
- `submitSearch()` trims before building the route.

That changes product behavior for leading/trailing spaces and whitespace-only queries. In the old page,
`kw=+++` is still a search state, the input shows the spaces, and Fuse receives the original string.

## Goal

Preserve old React keyword whitespace semantics while keeping the existing empty-string behavior and stable test hooks.

## Acceptance Criteria

- A direct visit to `/search?kw=%20%20%20` keeps the input value as three spaces.
- Whitespace-only `kw` is treated as a result state, not the recent-list state.
- Fuse receives the untrimmed keyword, so the current deterministic full-chain fixture returns the same rows as the old page for whitespace-only `kw`.
- Submitting ` Test 2024 ` keeps the leading/trailing spaces in the URL query.
- Empty string can still resolve to the recent-list `/search` state.
- `/rank/search` remains unused; search stays local Fuse-backed.

## Verification

- RED: update unit and full-chain tests to require preserved whitespace, then run the focused commands.
- GREEN: remove the trim behavior from the search helpers and submit path, then rerun focused commands.
- Full gate: `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
