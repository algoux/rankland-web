# SRK Extra Ref Link Spacing Parity Design

## Context

Old React `StyledRanklistRenderer` renders the hidden reference-link dropdown trigger as a plain span with only pointer cursor:

```tsx
<span style={{ cursor: 'pointer' }}>
  and {hiddenLinks.length} more <CaretDownOutlined />
</span>
```

The old JSX already places a literal space before the hidden-link part:

```tsx
相关链接：{mainLinksPart} {hiddenLinksPart}
```

The Vue wrapper preserves the text, caret, dropdown behavior, inherited color, and pointer cursor, but scoped CSS adds:

```less
.rankland-ranklist-ref-link-extra-action {
  margin-left: 4px;
  cursor: pointer;
}
```

That gives the hidden-link trigger an extra CSS offset that old React did not have.

## Decision

Remove the extra CSS `margin-left` from `.rankland-ranklist-ref-link-extra-action` while preserving:

- the stable `rankland-ranklist-ref-link-extra-action` hook;
- pointer cursor behavior;
- inherited header text color;
- the visible text `and N more`;
- the caret icon and hover dropdown behavior.

This is a narrow spacing parity slice. It does not change reference-link ordering, menu entries, link colors, or header layout.

## Tests

Extend the existing `/ranklist/:id` full-chain scenario because it renders the shared SRK wrapper with more than three reference links:

- assert the extra ref-link trigger text remains `and 1 more`;
- assert the caret remains visible;
- assert computed `margin-left` for `[data-id="rankland-ranklist-ref-link-extra-action"]` is `0px`.

The focused full-chain test must fail before implementation because the current CSS returns `4px`.

## Non-Goals

- Do not change hidden reference-link menu contents or hover-open behavior.
- Do not change primary link colors or inherited non-link text color.
- Do not alter contributor, time, or export/share header spacing.

## Acceptance Criteria

- Focused `/ranklist/:id` full-chain RED fails on `margin-left: 4px`.
- Focused `/ranklist/:id` full-chain GREEN passes after removing the extra margin.
- The full migration gate passes.
- Migration docs record SRK extra ref-link spacing parity.
