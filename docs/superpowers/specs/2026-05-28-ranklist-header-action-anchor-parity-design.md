# Ranklist Header Action Anchor Parity Design

## Goal

Restore the SRK header export/share action triggers to the old React anchor DOM and class contract while preserving the migrated Vue `data-id` selectors, hover dropdowns, export/share behavior, and verified link colors.

## Source Behavior

Old React `StyledRanklistRenderer.tsx` renders the header action triggers as no-`href` anchors:

```tsx
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

The triggers are not Ant Design buttons and do not carry `ant-btn`, `ant-btn-sm`, or Vue-only action helper classes. At runtime, Ant Design's Dropdown may append its own `ant-dropdown-trigger` class to the trigger anchor; that class is part of the dropdown integration rather than a Vue-only product class.

## Current Gap

The Vue renderer currently uses Ant Design Vue `<a-button>` nodes for both triggers. This produces `BUTTON` elements with Ant Design button classes plus Vue-only `rankland-ranklist-header-action-trigger` and `rankland-ranklist-header-action-separated` classes. Existing full-chain coverage checks visibility, icons, color, spacing, and utility-class presence, but it does not fail on the wrong tag or extra product classes.

## Design

- Keep the stable selectors:
  - `data-id="rankland-ranklist-export-menu-button"`
  - `data-id="rankland-ranklist-share-menu-button"`
- Render both triggers as plain `<a>` nodes without `href`.
- Export trigger runtime class list:
  - With metadata: `border-0 border-solid border-gray-400 mr-2 pl-2 border-l ant-dropdown-trigger`
  - Without metadata: `border-0 border-solid border-gray-400 mr-2 ant-dropdown-trigger`
- Share trigger runtime class list: `pl-2 border-0 border-l border-solid border-gray-400 ant-dropdown-trigger`
- Remove Vue-only trigger classes from the product DOM:
  - `.rankland-ranklist-header-action-trigger`
  - `.rankland-ranklist-header-action-separated`
- Remove Ant Design button output from these triggers.
- Retarget trigger styling to the stable `data-id` selectors so the existing primary/hover colors and border-left presentation remain unchanged.
- Keep menu item buttons inside Ant Design dropdown overlays unchanged.

## Test Strategy

- Add full-chain assertions in the primary ranklist detail route test:
  - export/share triggers have tagName `A`;
  - both have no `href`;
  - both lack `.ant-btn`, `.ant-btn-sm`, `.rankland-ranklist-header-action-trigger`, and `.rankland-ranklist-header-action-separated`;
  - export/share class lists match the old React utility classes plus Ant Design's runtime `ant-dropdown-trigger` when metadata is present.
- Add the same class/tag/no-`href` assertions for the live route, where metadata is absent and the export trigger must not include `pl-2 border-l`.
- Verify RED with focused ranklist and live tests before implementation.
- Verify GREEN with the same focused tests, then run full `ranklist.spec.ts` and `live.spec.ts` regressions.

## Acceptance Criteria

- Ranklist metadata route exports and shares still expose icons and hover dropdowns.
- Live no-metadata route still exposes export/share actions and keeps the no-metadata export separator behavior.
- Export/share action triggers render as no-`href` anchors.
- Trigger class lists match the old React utility classes plus Ant Design's runtime `ant-dropdown-trigger` for ranklist and live.
- Existing action colors, hover colors, export/download/share/copy behavior, and full migration gate remain green.

## Risks

- Ant Design Vue `a-dropdown` must continue to accept a plain anchor trigger. Full-chain hover/dropdown/export/share tests cover this path.
- CSS must be retargeted carefully so menu item buttons inside overlays keep their current transparent button reset.
