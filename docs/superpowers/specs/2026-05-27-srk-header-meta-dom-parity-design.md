# SRK Header Meta DOM Parity Design

## Context

Old React `StyledRanklistRenderer` renders the header metadata block as one `div.text-center.mt-1`:

```tsx
<div className="text-center mt-1">
  {meta && <span className="mr-2">...</span>}
  <ClientOnly>...</ClientOnly>
  {contributors.length > 0 && <p className="mb-0">贡献者：...</p>}
  {renderContestRefLinks(staticData.contest.refLinks)}
</div>
```

The migrated Vue wrapper already restores the class tokens, typography, links, action spacing, and colors, but its contributors and ref-links nodes are siblings after `[data-id="rankland-ranklist-header-meta"]`. That leaves a stable DOM parity gap for downstream styling hooks and screenshot review.

## Decision

Move `rankland-ranklist-contributors` and `rankland-ranklist-ref-links` inside the existing `[data-id="rankland-ranklist-header-meta"]` element, after the action block, while keeping:

- the existing data-id hooks;
- old child `span` wrappers around contributor/ref-link items;
- existing link `target="_blank"` and `rel="noopener"` behavior;
- existing time paragraph as a sibling after the meta block;
- existing visual spacing, text size, colors, hover behavior, dropdown behavior, and full-chain selectors.

## Test Strategy

Use the `/ranklist/:id` full-chain route because its fixture has:

- `meta.viewCnt`;
- visible contributors;
- visible and hidden reference links;
- export/share actions.

Add a DOM assertion that contributors and ref-links share `[data-id="rankland-ranklist-header-meta"]` as their parent. RED should fail because current Vue renders both as siblings of the meta block.

## Acceptance Criteria

- `[data-id="rankland-ranklist-contributors"]` parent is `[data-id="rankland-ranklist-header-meta"]`.
- `[data-id="rankland-ranklist-ref-links"]` parent is `[data-id="rankland-ranklist-header-meta"]`.
- Existing contributor/ref-link text, item-level `span` DOM, link attributes, colors, action spacing, and dropdown tests continue to pass.
- Full migration gate passes.

## Non-Goals

- Do not change header action behavior, Ant Design Vue dropdown implementation, link colors, or footer/modal behavior.
- Do not pursue broader SRK table pixel parity in this slice.
