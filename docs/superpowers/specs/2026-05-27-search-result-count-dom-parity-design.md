# Search result count DOM parity

## Context

The old React `/search` page renders the result summary as plain text:

```tsx
<div className="opacity-70">搜索到 {count} 个结果</div>
```

The Vue page currently wraps the count in an extra span:

```vue
<div class="opacity-70">搜索到 <span data-id="search-result-count">{{ searchRows.length }}</span> 个结果</div>
```

The outer result section already preserves the legacy `data-result-count` attribute, so the inner
`data-id="search-result-count"` marker is unnecessary and creates a Vue-only DOM difference.

## Goal

Restore the result summary to the old plain-text DOM while keeping result count observability through
`[data-id="search-result-section"][data-result-count]`.

## Acceptance Criteria

- `/search?kw=Test%202024` renders `搜索到 1 个结果` as exact text on the `div.opacity-70` summary.
- `/search?kw=NoSuchContest999` renders `搜索到 0 个结果` as exact text on the `div.opacity-70` summary.
- `[data-id="search-result-count"]` is absent in result states.
- `[data-id="search-result-section"]` continues exposing `data-result-count`.
- Search remains client-side Fuse-backed and does not call `/rank/search`.

## Verification

- RED: update full-chain tests to require exact plain text and no nested result-count span, then run the focused search specs.
- GREEN: remove the span from `search.view.vue`, rerun the focused search specs.
- Full gate: `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
