# App Header Nav Wrapper Parity Design

## Context

The old React shell renders the header middle navigation through `NavMenu` inside a plain wrapper:

```tsx
<div style={{ flex: 1, minWidth: 0 }}>
  <NavMenu />
</div>
```

That wrapper sits between the logo link and `RightMenu`, and it owns the old flex expansion / shrink boundary for the Ant Design horizontal menu. The current Vue shell renders the Ant Design Vue menu directly as a child of `.app-header-inner`; equivalent flex CSS lives on `.app-nav`, but the old DOM boundary is missing.

## Goal

Restore the old App header navigation wrapper contract:

- `.app-header-inner` direct child order remains logo link, navigation wrapper, site-switch area;
- the navigation wrapper is a plain `DIV`;
- the wrapper has inline `flex: 1` and `min-width: 0` style semantics;
- the Ant Design Vue horizontal menu remains inside that wrapper;
- existing nav selection, links, mobile metrics, site-switch dropdown, focus mode, theme sync, analytics, and BackTop behavior remain unchanged.

## Non-Goals

- Do not change public routes or generated route metadata.
- Do not change Ant Design Vue menu items, keys, selected state, or click behavior.
- Do not change site-switch trigger/menu DOM except for any sibling-position effects caused by inserting the nav wrapper.
- Do not change header padding, logo metrics, or mobile menu item padding.

## Test Strategy

Extend the existing app-shell full-chain test because this is public DOM/layout behavior visible only after the client-only Ant Design menu renders. Add a small helper that reads `.app-header-inner` direct children and verifies:

- the second direct child is a `DIV`;
- it computes `flex-grow: 1`, `flex-shrink: 1`, `flex-basis: 0%`, and `min-width: 0px`;
- it contains `[data-id="app-nav"]`;
- `[data-id="app-nav"]` is no longer a direct child of `.app-header-inner`.

Focused RED should fail on the current Vue shell because the second direct child is the Ant Design menu node itself. Focused GREEN should pass after wrapping the `ClientOnly` menu in a plain styled `div`.

## Acceptance Criteria

- The app-shell full-chain focused test passes.
- The full migration gate passes.
- Migration status, manual acceptance checklist, and final integration review mention the restored nav wrapper contract.
