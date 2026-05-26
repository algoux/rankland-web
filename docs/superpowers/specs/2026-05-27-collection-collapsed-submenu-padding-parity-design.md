# Collection Collapsed Submenu Padding Parity Design

## Context

The old React collection page has a scoped LESS rule for collapsed Ant Design menu submenus:

```less
.srk-collection-nav-menu {
  overflow-y: auto;
  .ant-menu-inline-collapsed > .ant-menu-submenu > .ant-menu-submenu-title {
    padding: 0;
    .srk-collection-menu-icon {
      @apply w-full;
    }
  }
}
```

The Vue collection page already restores the old Ant Design Vue inline menu, category icons, collapse behavior, shell classes, nav colors, hidden header DOM, and remaining-height animation. It restores the collapsed icon width but does not yet restore the old submenu-title `padding: 0`.

## Goal

Restore old collapsed collection submenu title padding without changing collection data loading, menu item generation, navigation behavior, or collapse state persistence.

## Scope

- Add full-chain coverage that, after the nav is collapsed, the category submenu title uses `padding-left: 0px` and `padding-right: 0px`.
- Add a Vue scoped `:deep(...)` rule matching the old Ant Design collapsed submenu title shape.
- Keep existing `.srk-collection-menu-icon` collapsed width coverage intact.

## Non-Goals

- Do not change nav width, menu height, transition timing, or selected-ranklist display behavior.
- Do not change category icon assets or labels.
- Do not pursue broader SRK table pixel parity in this slice.

## Test Strategy

Extend `tests/e2e/full-chain/collection.spec.ts` in `renders the legacy Ant Design collection menu with category icons`:

```ts
await page.locator('[data-id="collection-collapse-button"]').click();
await expect(page.locator('[data-id="collection-content"]')).toHaveClass(/is-nav-collapsed/);
const collapsedSubmenuTitle = page.locator(
  '[data-id="collection-nav-menu"].ant-menu-inline-collapsed > .ant-menu-submenu > .ant-menu-submenu-title',
).first();
await expect(collapsedSubmenuTitle).toHaveCSS('padding-left', '0px');
await expect(collapsedSubmenuTitle).toHaveCSS('padding-right', '0px');
```

The focused test should fail before implementation because Ant Design Vue keeps nonzero collapsed submenu title padding, then pass after the scoped style is restored.

## Acceptance Criteria

- Focused collection full-chain RED/GREEN is captured.
- Full migration gate passes.
- Migration status, manual checklist, and final integration review mention collection collapsed submenu padding parity.
- Slice is committed with a Chinese Conventional Commit message.
