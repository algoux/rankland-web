# Search Heading DOM Parity Design

## Context

The old React `/search` page renders the page heading as:

```tsx
<h3 className="mb-6">在榜单数据库中探索</h3>
```

The Vue migration currently renders:

```vue
<h3 class="search-heading mb-6">在榜单数据库中探索</h3>
```

The extra `.search-heading` class is Vue-only. Previous search slices restored the outer shell, state wrappers, section content wrappers, row content classes, and error message class contract. This slice restores the heading node class contract.

## Decision

Restore the old heading class contract:

- heading remains an `h3`;
- heading text remains `在榜单数据库中探索`;
- heading class becomes exact `mb-6`;
- no `.search-heading` class is emitted.

## Styling

Move the existing zero top margin behavior from `.search-heading` onto the scoped `.mb-6` utility:

```less
.mb-6 {
  margin-top: 0;
  margin-bottom: 24px;
}
```

This keeps the verified Ant Design-like heading top spacing stable while removing the Vue-only class token.

## Test Strategy

Update `tests/e2e/full-chain/search.spec.ts` before implementation:

- select `h3.mb-6` with the old heading text;
- assert exact class `mb-6`;
- assert no `.search-heading` exists;
- assert the heading keeps `margin-top: 0px` and `margin-bottom: 24px`.

The focused RED command should fail before implementation because the current heading has `class="search-heading mb-6"`.

## Acceptance Criteria

- `/search` heading matches old React `h3.mb-6` DOM/class contract.
- Existing heading text and spacing remain unchanged.
- Full migration gate passes after route regeneration.

## Risks

- Scoped `.mb-6` may apply to any future `mb-6` nodes in this component. This is acceptable for the current page, where the old React heading is the only `mb-6` element, and keeps the legacy utility-token approach used by adjacent search slices.
