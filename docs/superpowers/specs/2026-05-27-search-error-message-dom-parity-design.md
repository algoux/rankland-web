# Search Error Message DOM Parity Design

## Context

The old React `/search` page renders the ranklist initialization error as a two-level DOM:

```tsx
<div className="mt-10">
  <div className="text-red-500">初始化榜单数据库失败，请刷新再试。</div>
</div>
```

The Vue migration already restores the outer `mt-10` wrapper and the inner `text-red-500` token, but the inner message still carries a Vue-only `.search-error-message` class. That class is not part of the old React DOM contract and should not be needed once the `text-red-500` utility owns the color.

## Decision

Restore the old error message class contract:

- outer error wrapper remains `data-id="search-error" class="mt-10"`;
- inner error message becomes exact `class="text-red-500"`;
- no `.search-error-message` class is emitted;
- color remains `rgb(239, 68, 68)`.

## Styling

Move the existing red color declaration from `.search-error-message` to the scoped legacy utility token:

```less
.text-red-500 {
  color: #ef4444;
}
```

This keeps the visual result stable while removing the Vue-only hook.

## Test Strategy

Update `tests/e2e/full-chain/search.spec.ts` before implementation:

- select the inner error message through `[data-id="search-error"] > div.text-red-500`;
- assert exact `text-red-500` class;
- assert `.search-error-message` is absent;
- keep the existing message, outer `mt-10`, outer no-`text-red-500`, margin, and color checks.

The focused RED command should fail before implementation because the inner error node currently has `class="search-error-message text-red-500"`.

## Acceptance Criteria

- `/search` load-error state matches old React error message DOM/class contract.
- Existing load-error text, spacing, and red color remain unchanged.
- Full migration gate passes after route regeneration.

## Risks

- This slice intentionally does not remove other Vue-only search classes such as `.search-heading`, `.search-input`, or `.search-list-item`; each has separate layout/test-hook considerations and should be handled only with focused evidence.
