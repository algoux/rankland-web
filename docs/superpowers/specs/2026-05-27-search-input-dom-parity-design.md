# Search Input DOM Parity Design

## Context

The old React `/search` page renders the search control as:

```tsx
<Input.Search defaultValue={kw || ''} placeholder="输入关键词搜索" onSearch={onSearch} enterButton allowClear />
```

It does not emit a custom page-local class on `Input.Search`.

The Vue migration currently renders:

```vue
<a-input-search
  v-model:value="inputKeyword"
  data-id="search-input"
  class="search-input"
  placeholder="输入关键词搜索"
  allow-clear
  enter-button
  @search="submitSearch"
/>
```

The `.search-input` class is Vue-only. Previous `/search` slices restored the route shell, state wrappers, section wrappers, row content classes, error message class, and heading class contract. This slice removes the remaining Vue-only search input class while preserving the Ant Design Vue `Input.Search` behavior and stable `data-id` selector.

## Decision

Restore the old search input class contract:

- keep Ant Design Vue `a-input-search` as the migration equivalent of old React `Input.Search`;
- keep `data-id="search-input"` on the actual input for full-chain selectors;
- keep `placeholder="输入关键词搜索"`, `allow-clear`, `enter-button`, and `@search` routing behavior;
- remove the Vue-only `.search-input` class from the emitted DOM.

## Styling

Remove the scoped `.search-input { margin-top: 0; }` rule.

Old React did not attach a page-local class to `Input.Search`, and Ant Design's search wrapper already renders without top margin. The full-chain test will assert the wrapper keeps `margin-top: 0px` after the class is removed.

## Test Strategy

Update `tests/e2e/full-chain/search.spec.ts` before implementation:

- select the Ant Design search wrapper via `.ant-input-search:has([data-id="search-input"])`;
- assert it is visible and does not include `.search-input`;
- assert no `.search-input` element exists anywhere on the page;
- assert the wrapper keeps `margin-top: 0px`;
- keep existing assertions for the actual `.ant-input` with `data-id="search-input"` and the default boolean `enterButton` icon button.

The focused RED command should fail before implementation because the current Vue search input still emits `.search-input`.

## Acceptance Criteria

- `/search` no longer emits `.search-input`.
- Ant Design Vue `Input.Search` remains visible and usable with the existing `data-id="search-input"` selector.
- Search wrapper top spacing remains `0px`.
- Full migration gate passes after route generation.

## Risks

- Removing `.search-input` may expose Ant Design's default wrapper margin behavior. The focused full-chain assertion covers this directly.
