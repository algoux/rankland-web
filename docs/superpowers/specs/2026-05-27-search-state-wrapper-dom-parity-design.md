# Search State Wrapper DOM Parity Design

## Goal

Restore old React `/search` loading, error, result, and recent state wrapper DOM where the migrated Vue page still emits Vue-only wrapper classes or semantic section tags.

## Source Behavior

`rankland-fe/src/pages/search/index.tsx` renders these state wrappers:

```tsx
{loading && <Spin className="mt-10" />}
{error && (
  <div className="mt-10">
    <div className="text-red-500">初始化榜单数据库失败，请刷新再试。</div>
  </div>
)}
```

`renderResult()` returns:

```tsx
<div className="mt-10" data-id="search-result-section" data-result-count={String(count)}>
  <div className="opacity-70">搜索到 {count} 个结果</div>
  ...
</div>
```

`renderRecent()` returns:

```tsx
<div className="mt-10" data-id="search-recent-section">
  <div className="opacity-70">最近更新</div>
  ...
</div>
```

The old page relies on the `mt-10` class token for the outer state/section spacing and does not emit `.search-state`, `.search-section`, or semantic `<section>` wrappers.

## Current Gap

The migrated Vue page currently uses:

```vue
<a-spin v-if="loading" data-id="search-loading" class="search-state mt-10" />
<div v-else-if="loadError" data-id="search-error" class="search-state mt-10">...</div>
<section data-id="search-result-section" class="search-section mt-10">...</section>
<section data-id="search-recent-section" class="search-section mt-10">...</section>
```

Existing tests cover the old `mt-10` class token and computed spacing, but they do not prove that the Vue-only wrapper classes and `section` tags are absent.

## Target Behavior

- Keep the stable `data-id` hooks.
- Render the loading spinner with class `mt-10` and no Vue-only `.search-state` class.
- Render the error outer wrapper as `div.mt-10` and no Vue-only `.search-state` class.
- Render result and recent wrappers as `div.mt-10` nodes.
- Remove Vue-only `.search-section` from result and recent wrappers.
- Preserve existing computed spacing by making the old `mt-10` token carry the 40px top margin in this scoped view.
- Preserve search behavior, Ant Design Vue controls, list rows, empty-state behavior, and viewport bounds.

## Non-goals

- Do not change Fuse search semantics, request flow, query normalization, row item DOM, or list wrapper internals.
- Do not change the shell DOM restored by the previous Search shell DOM parity slice.
- Do not pursue subjective visual changes.

## Test Strategy

Update existing `/search` full-chain tests:

- Recent-list test: assert `[data-id="search-recent-section"]` has tag name `DIV` and lacks `.search-section`.
- Result-list test: assert `[data-id="search-result-section"]` has tag name `DIV` and lacks `.search-section`.
- Loading test: assert `[data-id="search-loading"]` lacks `.search-state` while preserving `.mt-10`.
- Error test: assert `[data-id="search-error"]` lacks `.search-state` while preserving outer `mt-10` and inner `text-red-500`.

Focused RED should fail on the current Vue implementation because loading/error wrappers still carry `.search-state`, and result/recent wrappers are `SECTION.search-section`.

## Acceptance Criteria

- Focused `/search` full-chain RED reproduces the Vue-only wrapper mismatch.
- Focused `/search` full-chain GREEN passes after the minimal Vue template/CSS change.
- Existing search page behavior and viewport checks continue to pass.
- Full migration gate passes.
