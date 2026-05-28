# App Header Right Menu Wrapper Parity Design

## Context

The old React shell renders the right-side site switch through `RightMenu`:

```tsx
<RightMenu />
```

`RightMenu` itself returns a plain wrapper:

```tsx
<div>
  <Dropdown overlay={switchSiteMenu}>
    <Button type="text" className="px-2">切换</Button>
  </Dropdown>
</div>
```

After restoring the header nav wrapper, the Vue shell still renders the Ant Design Vue dropdown/button directly as the third child of `.app-header-inner`. That keeps the visible button behavior, but it misses the old direct-child DOM boundary around the right menu.

## Goal

Restore the old App header right-menu wrapper contract:

- `.app-header-inner` direct child order is logo link, nav wrapper, right-menu wrapper;
- the right-menu wrapper is a plain `DIV`;
- the wrapper has no product class and no inline style;
- the existing site-switch Ant Design Vue button/dropdown remains inside that wrapper;
- existing site-switch href, target/rel, branch content, button metrics, nav behavior, focus mode, theme sync, analytics, and BackTop behavior remain unchanged.

## Non-Goals

- Do not change site-switch host/env precedence.
- Do not change site-switch current URL filtering.
- Do not change the dropdown overlay menu content or branch-specific word-break logic.
- Do not change header/logo/nav metrics beyond restoring the old right-menu DOM boundary.

## Test Strategy

Extend the existing app-shell full-chain test. Add a helper that reads `.app-header-inner` direct children and verifies:

- the direct child tag list is `A`, `DIV`, `DIV`;
- the third child is a plain `DIV`;
- the third child has no class list and no inline style;
- it contains `[data-id="app-site-switch"]`;
- `[data-id="app-site-switch"]` is no longer a direct child of `.app-header-inner`.

Focused RED should fail because the current Vue shell has the site-switch button directly as the third child. Focused GREEN should pass after wrapping the existing `<a-dropdown>` in a plain `div`.

## Acceptance Criteria

- The app-shell full-chain focused test passes.
- The app-shell desktop/mobile bounds focused test passes.
- The full migration gate passes.
- Migration status, manual acceptance checklist, and final integration review mention the restored right-menu wrapper contract.
