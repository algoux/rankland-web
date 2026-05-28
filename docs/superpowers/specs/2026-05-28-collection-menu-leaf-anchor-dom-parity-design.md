# Collection Menu Leaf Anchor DOM Parity Design

## Context

The old React collection route renders ranklist leaf menu labels through `umi` `Link`:

```tsx
<Link
  data-id={`collection-menu-item-${item.uniqueKey}`}
  data-collection-key={item.uniqueKey}
  to={childUrlFormatter(item.uniqueKey)}
  onClick={(e) => {
    e.preventDefault();
  }}
>
  {item.name}
</Link>
```

The current Vue collection route renders leaf labels as `span role="link"` and adds `aria-current` for the selected ranklist. That preserves click behavior through Ant Design Vue Menu, but it does not preserve the old public DOM/link contract.

## Goal

Restore old collection menu leaf anchor DOM parity:

- Ranklist leaf menu labels render as `A` elements.
- The anchor keeps `data-id` and `data-collection-key`.
- The anchor `href` points to the old collection URL with `rankId`.
- The anchor does not add the Vue-only `role="link"` or `aria-current="page"` attributes.
- The anchor prevents native navigation while allowing the Ant Design Vue Menu click handler to drive the existing route update.

## Non-Goals

- Do not change directory menu labels; they already render as plain `SPAN`.
- Do not change selected keys, open keys, category icons, collapse behavior, mobile behavior, or remaining-height layout.
- Do not change invalid `rankId` cleanup or ranklist loading behavior.

## Test Strategy

Extend the existing collection full-chain menu test with a DOM helper for one ranklist leaf label:

- assert the node tag is `A`;
- assert `href` ends with `/collection/official?rankId=test-key`;
- assert the node has no `role` and no `aria-current`;
- assert the directory label remains `SPAN` to avoid over-broad changes.

Focused RED should fail because the current ranklist leaf is a `SPAN` with Vue-only link semantics. Focused GREEN should pass after rendering a plain anchor label.

## Acceptance Criteria

- Focused collection menu full-chain test passes.
- Collection mobile/click behavior remains green.
- Collection desktop/mobile bounds remain green.
- The full migration gate passes.
- Migration status, manual acceptance checklist, and final integration review mention the restored collection menu leaf anchor DOM contract.
