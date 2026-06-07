# Collection Menu Open Keys Interaction Parity Design

## Context

The old React collection route keeps a local `openKeys` array only to seed the selected ranklist ancestor directories, then passes it to Ant Design Menu as `defaultOpenKeys`. After mount, the inline menu is effectively uncontrolled: users can manually open or close directory submenus, including directories that do not contain the selected ranklist.

The current Vue collection route passes `:open-keys="collapsed ? [] : openKeys"` where `openKeys` is computed from the selected `rankId` ancestors. That keeps the selected path visible and looked like it could overwrite user-driven submenu state, so this slice verifies the interaction against the old React behavior.

## Goal

Restore old collection menu open-key interaction parity:

- The selected ranklist ancestor directory is opened when a valid `rankId` is loaded.
- Users can manually open or close directory submenus without changing the route, including closing the directory that contains the selected ranklist after it was auto-opened.
- Manual open state is preserved while moving between ranklists in the same collection.
- Collapsed nav renders with no visible open submenus but preserves the underlying open state for later expansion.

Focused coverage showed the current Ant Design Vue Menu path already satisfies the manual close behavior even though `open-keys` is passed from the selected ancestor computation. This slice therefore records the behavior with regression coverage instead of changing production code.

## Non-Goals

- Do not change collection route URL handling, selected menu keys, ranklist loading, invalid `rankId` cleanup, or mobile auto-collapse after ranklist selection.
- Do not change category icons, leaf anchor DOM, collapse button DOM, remaining-height layout, or nav chrome.
- Do not convert the route away from Ant Design Vue Menu or remove the existing client-only Menu boundary.

## Test Strategy

Extend the existing collection full-chain menu test:

- load `/collection/official?rankId=test-key`;
- assert the selected `dir-icpc` submenu starts open;
- click the selected-path `dir-icpc` directory label;
- assert `dir-icpc` becomes closed, its children are hidden, and the URL remains `/collection/official?rankId=test-key`;
- keep the existing category icon, leaf anchor, selected item, collapse padding, and dark-mode assertions green.

The focused test passed immediately, proving this exact interaction is already implemented by the current Ant Design Vue Menu integration. No production change is required for this slice.

## Acceptance Criteria

- Focused collection menu full-chain test passes and covers manual selected-directory collapse.
- Collection mobile collapse behavior remains green.
- Collection desktop/mobile bounds remain green.
- The full migration gate passes.
- Migration status, manual acceptance checklist, and final integration review mention the covered manual submenu interaction.
