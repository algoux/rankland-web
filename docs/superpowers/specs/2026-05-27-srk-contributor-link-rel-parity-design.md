# SRK contributor link rel parity design

## Context

The old React `StyledRanklistRenderer` renders SRK header contributor links from `Name (url)` contributor strings with `target="_blank"` and `rel="noopener"`:

```tsx
<a href={url} target="_blank" rel="noopener">
  {name}
</a>
```

The migrated Vue renderer preserves contributor parsing, text, item-level `span` wrappers, and `target="_blank"`, but contributor links still render `rel="noreferrer"`. That changes the public DOM and referrer behavior for contributor URL entries compared with old React.

## Scope

- Add deterministic fixture coverage for one URL contributor using the old `Name (url)` contributor format.
- Restore `rel="noopener"` for SRK header contributor links.
- Keep plain text contributors, item-level `span` wrappers, comma separators, text, colors, font size, and spacing unchanged.

## Non-goals

- Do not change header reference links; those are already restored in the SRK header ref-link rel parity slice.
- Do not change footer links or package/project links.
- Do not change contributor parsing behavior from `@algoux/standard-ranklist-utils`.

## Test strategy

- Extend the main `/ranklist/:id` full-chain fixture with one contributor string that resolves to a URL contributor.
- Extend the ranklist full-chain test to assert the contributor anchor uses `target="_blank"` and `rel="noopener"`.
- Run the focused ranklist full-chain test and confirm RED before implementation.
- Run the focused test again after implementation.
- Run the full migration gate before commit.

## Acceptance criteria

- URL contributors render as old React contributor anchors with `rel="noopener"`.
- Existing plain text contributor, item-level span DOM, header text size, color, and spacing assertions remain green.
- Full migration gate passes.
