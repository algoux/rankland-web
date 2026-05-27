# SRK ref-link item span DOM parity design

## Context

The old React `StyledRanklistRenderer` renders each visible contest reference link as an individual `span`:

```tsx
const mainLinksPart = mainLinks.map((refLink, i) => (
  <span key={`${i}-${refLink.link}`}>
    {i > 0 && ', '}
    {renderContestRefLink(refLink)}
  </span>
));
```

The migrated Vue renderer now restores the outer reference-link wrapper as `span`, but the visible link items are still rendered as bare anchors with separate comma spans. That preserves text and visual behavior, but not the old item-level DOM structure.

## Scope

- Wrap each visible SRK header reference link in its own `span`, matching old React.
- Keep the outer `data-id="rankland-ranklist-ref-links"` wrapper and `.rankland-ranklist-ref-links` class.
- Preserve link text, comma separators, hidden-link dropdown, colors, hover behavior, and spacing.

## Non-goals

- Do not change the outer wrapper restored by the previous slice.
- Do not change hidden reference-link dropdown behavior or menu contents.
- Do not change header contributors, export/share controls, or link color styling.

## Test strategy

- Extend the main `/ranklist/:id` full-chain route test to assert the visible reference-link direct child spans contain `Official Site`, `, Mirror`, and `, Statements`.
- Run the focused full-chain ranklist route test and observe RED before implementation.
- Run the focused test again after implementation.
- Run the full migration gate before commit.

## Acceptance criteria

- The visible SRK header reference links render as three item-level `span` wrappers, each containing the corresponding anchor.
- Existing text, outer wrapper tag, `and N more` trigger, caret icon, colors, hover dropdown, and spacing assertions remain green.
- Full migration gate passes.
