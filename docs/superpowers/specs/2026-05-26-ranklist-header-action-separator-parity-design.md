# Ranklist Header Action Separator Parity Design

## Context

The old React `StyledRanklistRenderer` renders the export and share triggers as icon links inside the header metadata block:

```tsx
<a className={`border-0 border-solid border-gray-400 mr-2 ${meta ? 'pl-2 border-l' : ''}`}>
  <Dropdown ...>
    <DownloadOutlined />
  </Dropdown>
</a>
<a className="pl-2 border-0 border-l border-solid border-gray-400">
  <Dropdown ...>
    <ShareAltOutlined />
  </Dropdown>
</a>
```

When a view-count `meta` block is present, both action triggers have a 1px left divider and 8px left padding. The migrated Vue wrapper already restores the Ant Design Vue icons and hover dropdown behavior, but its local button reset removes this visible separator:

```less
.rankland-ranklist-header-actions button,
:global(.ant-dropdown-menu-item) button {
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
  text-align: left;
}
```

## Decision

Keep the existing Ant Design Vue dropdown and `a-button` triggers, but add a local header-action trigger class that restores the old icon-link separator treatment:

- left padding: `8px`;
- left border: `1px solid #9ca3af`, matching Tailwind `border-gray-400`;
- no top/right/bottom border;
- no button-radius or button-shadow chrome.

The menu item button reset remains unchanged for dropdown menu contents.

## Scope

In scope:

- Shared `src/client/components/rankland-ranklist.vue` export/share header action triggers.
- Full-chain `/ranklist/:id` coverage using the existing header action assertions.
- Migration dashboard updates.

Out of scope:

- Export/share dropdown item structure and copy/download behavior.
- View-count text/icon behavior.
- Header contributors/ref-link behavior.
- Collection/live route-specific assertions; the shared wrapper change applies there through the same component.

## Test Strategy

Extend the existing `/ranklist/test-key?focus=yes` full-chain test after the header action icon assertions. Read computed styles from both `data-id="rankland-ranklist-export-menu-button"` and `data-id="rankland-ranklist-share-menu-button"` and assert:

- `paddingLeft` is `8px`;
- `borderLeftWidth` is `1px`;
- `borderTopWidth`, `borderRightWidth`, and `borderBottomWidth` are `0px`;
- `borderRadius` is `0px`.

The RED failure should show the current Vue triggers still have `paddingLeft: 0px` and `borderLeftWidth: 0px`.

## Acceptance Criteria

- Focused ranklist full-chain test fails before implementation for missing trigger separators.
- Focused ranklist full-chain test passes after implementation.
- Existing icon, hover dropdown, export, and share-copy assertions remain green.
- Required gates pass: `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check`.
- `docs/migration/status.md` records header action separator parity.
