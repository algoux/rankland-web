# SRK contributor item span DOM parity design

## Context

The old React `StyledRanklistRenderer` renders each resolved contributor as an individual `span`:

```tsx
const renderContributors = (contributors: srk.Contributor[]) => {
  return contributors.map((contributor, i) => (
    <span key={contributor}>
      {i > 0 && ', '}
      {renderContributor(contributor)}
    </span>
  ));
};
```

The migrated Vue renderer preserves the contributor text, link, outer `p.mb-0`, and header spacing, but renders the comma separator as a separate `span` and link/text as bare children. That differs from the old item-level DOM structure.

## Scope

- Wrap each visible SRK header contributor in its own `span`, matching old React.
- Keep the outer `data-id="rankland-ranklist-contributors"` paragraph and `.rankland-ranklist-contributors mb-0` classes.
- Preserve contributor text, URL, comma separators, text size, color, and header spacing.

## Non-goals

- Do not change `resolveContributor` semantics.
- Do not change reference-link, export/share, progress, filter, modal, or footer behavior.
- Do not change low-level SRK table rendering.

## Test strategy

- Extend the main `/ranklist/:id` full-chain route test to assert contributor direct-child spans contain `https://github.com/rankland-alpha` and `, Team Beta`.
- Run the focused full-chain ranklist route test and observe RED before implementation.
- Run the focused test again after implementation.
- Run the full migration gate before commit.

## Acceptance criteria

- The visible SRK header contributors render as item-level `span` wrappers, each containing the corresponding contributor link/text.
- Existing contributor text, outer paragraph tag/classes, text size, spacing, and link color assertions remain green.
- Full migration gate passes.
