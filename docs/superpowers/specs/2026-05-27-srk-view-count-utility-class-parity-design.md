# SRK View Count Utility Class Parity Design

## Context

Old React `StyledRanklistRenderer` renders the header view-count span with the legacy utility class:

```tsx
<span className="mr-2">
  <EyeOutlined /> {meta.viewCnt || '-'}
</span>
```

The Vue wrapper already restores the old eye icon, fallback text, text color, and 14px inherited header text size, but `[data-id="rankland-ranklist-view-count"]` only carries the migrated hook class. That loses the old `mr-2` class token on a shared SRK header element.

## Decision

Restore the old `mr-2` utility class token on the Vue header view-count span while preserving:

- the stable `rankland-ranklist-view-count` hook;
- existing icon and fallback behavior;
- current header action separator behavior;
- current computed header spacing covered by existing tests.

This is a narrow DOM/class parity slice. The current flex header layout already preserves the visible 8px separation, so the implementation only needs to restore the old class token.

## Tests

Extend the existing `/ranklist/:id` full-chain scenario because it renders the shared SRK wrapper through SSR, hydration, API metadata, and browser CSS:

- assert `[data-id="rankland-ranklist-view-count"]` carries `mr-2`;
- keep the existing visible text, eye icon, text-size, color, and action assertions unchanged.

The focused full-chain test must fail before implementation because the current class list does not contain `mr-2`.

## Non-Goals

- Do not alter view-count visibility or missing-`viewCnt` fallback semantics.
- Do not restyle the header action group, link colors, or separators.
- Do not change collection/live route behavior beyond inheriting the shared wrapper markup.

## Acceptance Criteria

- Focused `/ranklist/:id` full-chain RED fails on the missing `mr-2` class.
- Focused `/ranklist/:id` full-chain GREEN passes after restoring the class.
- The full migration gate passes.
- Migration docs record SRK view-count utility-class parity.
