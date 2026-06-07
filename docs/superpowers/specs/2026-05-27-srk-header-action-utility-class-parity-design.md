# SRK Header Action Utility Class Parity Design

## Context

The old React `StyledRanklistRenderer` renders export/share action triggers inside header metadata with legacy utility class tokens:

```tsx
<a className={`border-0 border-solid border-gray-400 mr-2 ${meta ? 'pl-2 border-l' : ''}`}>
  <Dropdown><DownloadOutlined /></Dropdown>
</a>
<a className="pl-2 border-0 border-l border-solid border-gray-400">
  <Dropdown><ShareAltOutlined /></Dropdown>
</a>
```

The migrated Vue wrapper already preserves the computed action spacing, border, icon color, hover color, Ant Design Vue Dropdown/Menu behavior, export group, and share notifications. It does not expose the old utility class tokens on the action trigger nodes.

## Decision

Restore the old header action utility class tokens alongside migrated hooks:

- export trigger: keep `rankland-ranklist-header-action-trigger`; add `border-0 border-solid border-gray-400 mr-2`; add `pl-2 border-l` only when metadata/view-count is present, matching old `meta ? 'pl-2 border-l' : ''`;
- share trigger: keep `rankland-ranklist-header-action-trigger rankland-ranklist-header-action-separated`; add `pl-2 border-0 border-l border-solid border-gray-400`.

Do not change action components from Ant Design Vue `a-button` back to anchor tags. Existing scoped styles remain the source of computed border/padding/color behavior.

## Scope

In scope:

- `src/client/components/rankland-ranklist.vue` export/share action trigger class tokens.
- Focused full-chain assertions for ranklist metadata route and live no-metadata route.
- Migration docs after verification.

Out of scope:

- Export/share dropdown content, notification behavior, clipboard behavior, action icons, or header layout.
- Low-level SRK table rendering.
- Adding global utility CSS.

## Test Strategy

Extend existing full-chain checks:

- `/ranklist/:id` main scenario has metadata, so export trigger should include `border-0 border-solid border-gray-400 mr-2 pl-2 border-l`, and share trigger should include `pl-2 border-0 border-l border-solid border-gray-400`.
- `/live/:id` main scenario has no metadata, so export trigger should include `border-0 border-solid border-gray-400 mr-2` and must not include `pl-2` / `border-l`; share trigger should still include `pl-2 border-0 border-l border-solid border-gray-400`.
- Existing computed style assertions remain unchanged.

The focused RED should fail before implementation because the current Vue action triggers lack those old utility class tokens.

## Acceptance Criteria

- Focused ranklist full-chain test fails before implementation for missing action utility class tokens.
- Focused live full-chain test would catch no-metadata export separator regression.
- Focused ranklist full-chain test passes after implementation.
- Existing action spacing, colors, hover behavior, dropdowns, export actions, share notifications, and no-metadata separator behavior stay green.
- Full migration gate passes: `gen:client-router`, `test:migration`, and `git diff --check`.
