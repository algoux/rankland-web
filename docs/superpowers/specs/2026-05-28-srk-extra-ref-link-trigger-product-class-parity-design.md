# SRK Extra Ref-Link Trigger Product Class Parity Design

## Context

The old React `StyledRanklistRenderer` renders hidden contest reference links with:

```tsx
<span style={{ cursor: 'pointer' }}>
  and {hiddenLinks.length} more <CaretDownOutlined />
</span>
```

There is no product class on that trigger. The Vue migration currently renders the same visible text and caret through a stable `data-id`, but still exposes a Vue-only class:

```html
<span data-id="rankland-ranklist-ref-link-extra-action" class="rankland-ranklist-ref-link-extra-action">
```

This slice removes that product class while preserving pointer cursor, inherited header text color, zero left margin, caret rendering, and hover dropdown behavior.

Ant Design may still append its own runtime `ant-dropdown-trigger` class to the trigger. That runtime class is outside this slice; the parity target is removal of the Vue-only product class.

## Scope

- Remove `.rankland-ranklist-ref-link-extra-action` from the hidden reference-link trigger product DOM.
- Keep `data-id="rankland-ranklist-ref-link-extra-action"` for E2E selectors and scoped style.
- Move cursor styling from the product class selector to the stable `data-id` selector.
- Preserve the existing Ant Design Vue Dropdown/Menu behavior and hidden ref-link anchor `target="_blank"` / `rel="noopener"` contract.

## Non-Goals

- Do not change the visible main reference-link item DOM.
- Do not change the number of main links before the overflow trigger.
- Do not change export/share header actions.
- Do not change low-level SRK table rendering.

## Test Strategy

Extend the existing `/ranklist/:id` full-chain happy path test:

- Assert the trigger text remains `and 1 more`.
- Assert the caret icon remains visible.
- Assert the trigger does not include the Vue-only product class and still receives AntD's runtime trigger class.
- Preserve existing assertions for `margin-left: 0px`, inherited text color, hover dropdown opening, and extra hidden link attributes.

## Acceptance Criteria

- `[data-id="rankland-ranklist-ref-link-extra-action"]` renders without the Vue-only `rankland-ranklist-ref-link-extra-action` product class.
- The trigger still has computed `cursor: pointer`.
- Existing color, margin, caret, hover dropdown, and hidden-link anchor assertions remain green.
- Full migration gate passes and migration docs record the slice.
