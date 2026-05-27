# Search List Item DOM Parity Design

## Context

The old React `/search` page renders search result and recent ranklist rows as Ant Design `List.Item` nodes without a page-local class:

```tsx
<List.Item data-id="search-ranklist-item" data-ranklist-key={item.uniqueKey}>
  <p className="mb-0">...</p>
  <p className="mb-0 opacity-50 text-sm">...</p>
</List.Item>
```

The Vue migration currently renders:

```vue
<a-list-item
  data-id="search-ranklist-item"
  class="search-list-item"
  :data-ranklist-key="item.uniqueKey"
>
  ...
</a-list-item>
```

and includes:

```less
.search-list-item {
  display: block;
}
```

The `.search-list-item` class and display override are Vue-only. Previous search slices restored the route shell, state wrappers, section wrappers, row content classes, error message class, heading class, and input class contract. This slice restores the row container DOM/class contract.

## Decision

Restore the old list item class contract:

- keep Ant Design Vue `a-list-item` as the migration equivalent of old React `List.Item`;
- keep `data-id="search-ranklist-item"` and `data-ranklist-key` for stable full-chain selectors;
- remove the Vue-only `.search-list-item` class from both result and recent rows;
- remove the scoped display override so the row follows Ant Design's default list item layout.

## Styling

Delete:

```less
.search-list-item {
  display: block;
}
```

The old React implementation did not attach a page-local row class or override `List.Item` display. Full-chain coverage will assert no `.search-list-item` is emitted and the Ant Design row display is `flex`.

## Test Strategy

Update `tests/e2e/full-chain/search.spec.ts` before implementation:

- in the recent-list coverage, assert each row is still `.ant-list-item`, does not include `.search-list-item`, no `.search-list-item` exists, and the first row has `display: flex`;
- in the result-list utility class coverage, assert result and recent rows do not include `.search-list-item` and keep `display: flex`;
- keep existing child content assertions for exact `p.mb-0`, `span.ml-2.opacity-70`, and `p.mb-0.opacity-50.text-sm` classes.

The focused RED command should fail before implementation because current rows still emit `.search-list-item` and compute `display: block`.

## Acceptance Criteria

- `/search` result and recent rows no longer emit `.search-list-item`.
- Ant Design Vue list rows remain visible and selectable through existing `data-id` selectors.
- Row child content class parity remains unchanged.
- Ant Design list item display returns to `flex`.
- Full migration gate passes after route generation.

## Risks

- Removing the display override may change row visual wrapping. This is intentional because the old React `List.Item` did not apply the Vue-only block override; viewport bounds coverage remains part of `test:migration`.
