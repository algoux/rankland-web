# Search Load Error Color Parity Design

## Context

The old React `/search` page renders the list initialization failure state as:

```tsx
<div className="mt-10">
  <div className="text-red-500">初始化榜单数据库失败，请刷新再试。</div>
</div>
```

That means the visible error message uses the old Tailwind `text-red-500` color from Tailwind 2.2, `#ef4444`, while the outer state keeps the existing `mt-10` top spacing.

The current Vue search page has the same message and 40px top spacing, but uses a custom `.search-error` color of `#b42318`. This makes the error state visibly darker than the old React product surface.

## Decision

Restore the old search load error message color:

- keep the current Ant Design Vue search input, loading spinner, recent/result sections, and route behavior unchanged;
- keep the existing 40px top spacing for the error state;
- set `.search-error` to the old Tailwind `text-red-500` color `#ef4444`.

## Tests

Extend the `/search` full-chain route test because the state depends on CSR loading and the RankLand API list-all request:

- mock `/rank/listall` as a wrapped upstream failure;
- assert `[data-id="search-error"]` shows the legacy message;
- assert the error block keeps `40px` top spacing;
- assert the computed text color is `rgb(239, 68, 68)`.

The focused full-chain test must fail before implementation because the current Vue color computes to the custom darker red.

## Non-Goals

- Do not change the search input, recent list, Fuse search result behavior, or zero-result behavior.
- Do not alter API error mapping globally.
- Do not change other route error colors.

## Acceptance Criteria

- The focused search full-chain test fails before implementation for the expected error color mismatch.
- The focused test passes after implementation.
- The full migration gate passes.
- Migration docs record search load error color parity.
