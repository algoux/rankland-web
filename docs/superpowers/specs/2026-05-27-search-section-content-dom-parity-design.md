# Search Section Content DOM Parity Design

## Goal

Restore old React `/search` result/recent section inner content DOM by removing remaining Vue-only title, list, and empty-state wrapper classes.

## Source Behavior

`rankland-fe/src/pages/search/index.tsx` renders result content as:

```tsx
<div className="mt-10" data-id="search-result-section" data-result-count={String(count)}>
  <div className="opacity-70">搜索到 {count} 个结果</div>
  {count > 0 && (
    <div className="mt-2">
      <List ... />
    </div>
  )}
</div>
```

It renders recent content as:

```tsx
<div className="mt-10" data-id="search-recent-section">
  <div className="opacity-70">最近更新</div>
  {allData && allData.ranks.length > 0 ? (
    <div className="mt-2">
      <List ... />
    </div>
  ) : (
    <div className="mt-2">暂无最近更新的榜单</div>
  )}
</div>
```

The old title nodes only carry `opacity-70`. The old list spacing comes from a wrapping `div.mt-2`, not from a class on the Ant Design List root. The old empty state only carries `mt-2`.

## Current Gap

The migrated Vue page currently renders:

```vue
<div class="search-section-title opacity-70">...</div>
<a-list class="search-list mt-2" ...>
<div class="search-empty-state mt-2">暂无最近更新的榜单</div>
```

That keeps Vue-only `.search-section-title`, `.search-list`, and `.search-empty-state` classes. It also puts `mt-2` on the Ant Design Vue list instead of the old wrapper `div`.

## Target Behavior

- Keep stable `data-id` hooks.
- Render result/recent title nodes as `div.opacity-70` with no `.search-section-title`.
- Render result/recent lists inside `div.mt-2` wrappers.
- Render Ant Design Vue list roots without Vue-only `.search-list` and without `mt-2`.
- Render the recent empty state as `div.mt-2` with no `.search-empty-state`.
- Preserve the 8px list/empty-state top spacing by making scoped `.mt-2` carry the old margin.
- Preserve search behavior, Ant Design Vue list rows, row utility class parity, dark-mode inherited text color, and viewport bounds.

## Non-goals

- Do not change search logic, API calls, route query behavior, row item classes, links, view-count icon, or created-at formatting.
- Do not change state wrapper DOM restored by the previous Search state wrapper DOM parity slice.
- Do not remove row-level migrated hooks in this slice.

## Test Strategy

Update existing `/search` full-chain tests:

- Recent-list test: assert the section title direct child has only old `opacity-70`, the list is under `div.mt-2`, and `.search-list` is absent.
- Result-list test: assert the result title direct child has only old `opacity-70`, the list is under `div.mt-2`, and `.search-list` is absent.
- Recent-empty test: assert the empty-state direct child is `div.mt-2`, has the old text and inherited dark text color, and `.search-empty-state` is absent.
- Utility-class test: switch list spacing assertions from `.search-list.mt-2` to the old wrapper `div.mt-2 > .ant-list`.

Focused RED should fail on the current Vue implementation because title nodes still carry `.search-section-title`, list roots still carry `.search-list mt-2`, and empty state still carries `.search-empty-state`.

## Acceptance Criteria

- Focused `/search` full-chain RED reproduces the title/list/empty wrapper mismatch.
- Focused `/search` full-chain GREEN passes after the minimal Vue template/CSS change.
- Existing search behavior and viewport checks continue to pass.
- Full migration gate passes.
