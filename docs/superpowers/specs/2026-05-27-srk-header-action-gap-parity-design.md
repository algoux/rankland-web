# SRK Header Action Gap Parity Design

## Context

Old React `StyledRanklistRenderer` renders the header meta/action line as a `div.text-center.mt-1` with inline children. Spacing between the view count, export trigger, and share trigger comes from old utility classes:

```tsx
<span className="mr-2">
  <EyeOutlined /> {meta.viewCnt || '-'}
</span>
<a className={`border-0 border-solid border-gray-400 mr-2 ${meta ? 'pl-2 border-l' : ''}`}>
  <Dropdown>
    <DownloadOutlined />
  </Dropdown>
</a>
<a className="pl-2 border-0 border-l border-solid border-gray-400">
  <Dropdown>
    <ShareAltOutlined />
  </Dropdown>
</a>
```

There is no flex `gap` on the old action group. The migrated Vue wrapper preserves the old class tokens, padding, borders, icon colors, hover colors, and dropdown behavior, but its scoped CSS also adds `gap: 8px` to `.rankland-ranklist-header-meta` and `.rankland-ranklist-header-actions`. That introduces extra visual spacing beyond the old utility-class spacing.

## Decision

Remove the Vue-only flex gap from the SRK header meta/action row while keeping:

- stable `data-id` hooks for header meta/actions;
- `inline-flex` wrapping behavior used by the migrated responsive header;
- old `mr-2`, `pl-2`, `border-l`, `border-0`, `border-solid`, and `border-gray-400` class tokens;
- old computed 8px left padding and 1px left border on separated action triggers;
- existing icon color, hover color, and dropdown behavior.

This slice only changes header action spacing. It does not alter action availability, menu contents, notification behavior, reference-link spacing, or live no-metadata action separator behavior.

## Tests

Extend the existing `/ranklist/:id` full-chain detail scenario, next to the existing header action class/style assertions:

- assert `[data-id="rankland-ranklist-header-meta"]` has computed `column-gap: normal` and `row-gap: normal`;
- assert `[data-id="rankland-ranklist-header-actions"]` has computed `column-gap: normal` and `row-gap: normal`;
- keep the existing assertions for old action trigger class tokens, padding, border, color, hover, and dropdown behavior.

The focused full-chain test must fail before implementation because current Vue CSS computes `column-gap: 8px` and `row-gap: 8px`.

## Non-Goals

- Do not change the header action DOM structure or replace Ant Design Vue dropdowns.
- Do not change `rankland-ranklist-ref-link-extra-action` spacing from the previous slice.
- Do not change controls/filter row gaps or mobile control layout.
- Do not change export/share menu item text or copy/download behavior.

## Acceptance Criteria

- Focused `/ranklist/:id` full-chain RED fails on Vue-only header meta/action `8px` gap.
- Focused `/ranklist/:id` full-chain GREEN passes after removing the extra gap.
- The full migration gate passes.
- Migration docs record SRK header action gap parity.
