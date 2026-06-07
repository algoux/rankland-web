# SRK header ref-link rel parity design

## Context

The old React `StyledRanklistRenderer` renders SRK header contest reference links with `target="_blank"` and `rel="noopener"`:

```tsx
<a href={link} target="_blank" rel="noopener">
  {title}
</a>
```

The migrated Vue renderer currently renders the same reference links with `rel="noreferrer"`. That keeps the links usable, but it changes the public DOM and referrer behavior compared with old React.

## Scope

- Restore `rel="noopener"` for visible SRK header reference links.
- Restore `rel="noopener"` for hidden reference-link dropdown items.
- Keep `target="_blank"`, `href`, text, colors, hover behavior, dropdown behavior, and item-level `span` wrappers unchanged.

## Non-goals

- Do not change contributor rendering. The current fixture contributors are plain strings and therefore exercise the old React text path, not the contributor URL path.
- Do not change footer links; old React footer links did not use this helper path and should be handled separately only if product review requires it.
- Do not change export/share dropdown actions.
- Do not change link color styling or hidden reference-link spacing.

## Test strategy

- Extend the main `/ranklist/:id` full-chain route test to assert visible reference links use `rel="noopener"` and `target="_blank"`.
- Assert the hidden reference-link dropdown item also uses `rel="noopener"` after opening the dropdown.
- Run the focused ranklist full-chain test and observe RED before implementation.
- Run the focused test again after implementation.
- Run the full migration gate before commit.

## Acceptance criteria

- Visible ref-link and hidden ref-link anchors match old React `rel="noopener"` behavior.
- Existing text, item-level span DOM, colors, hover dropdown, and spacing assertions remain green.
- Full migration gate passes.
