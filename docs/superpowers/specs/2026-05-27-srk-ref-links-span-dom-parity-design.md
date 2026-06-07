# SRK ref-links span DOM parity design

## Context

The old React `StyledRanklistRenderer` renders contest reference links through `renderContestRefLinks` as a bare inline wrapper:

```tsx
return (
  <span>
    相关链接：{mainLinksPart} {hiddenLinksPart}
  </span>
);
```

The migrated Vue renderer currently preserves the reference-link text, colors, hover behavior, and spacing, but renders the wrapper as:

```vue
<p data-id="rankland-ranklist-ref-links" class="rankland-ranklist-ref-links">
```

Most recent SRK parity slices have been tightening old DOM/class tokens after visual parity was already covered. This slice restores the old wrapper tag without changing link behavior.

## Scope

- Change the SRK header contest reference-link wrapper from `p` to `span`.
- Preserve the stable `data-id="rankland-ranklist-ref-links"` selector and `.rankland-ranklist-ref-links` class.
- Preserve existing text, hidden-link dropdown, colors, and spacing coverage.

## Non-goals

- Do not move contributors or ref-links back inside the header meta block in this slice.
- Do not change the reference-link slicing, dropdown trigger, colors, hover behavior, or menu contents.
- Do not change header export/share controls.

## Test strategy

- Extend the main `/ranklist/:id` full-chain route test to assert `[data-id="rankland-ranklist-ref-links"]` renders as `SPAN`.
- Run the focused full-chain ranklist route test and observe RED before implementation.
- Run the focused test again after implementation.
- Run the full migration gate before commit.

## Acceptance criteria

- The ranklist header reference-link wrapper renders as a `span`.
- Existing reference-link text, `and N more` trigger, caret icon, colors, hover dropdown, and spacing assertions remain green.
- Full migration gate passes.
