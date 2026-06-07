# Ranklist Export Menu Group Parity Design

## Goal

Restore the old React export dropdown grouping in the Vue SRK wrapper header.

## Old React Baseline

`rankland-fe/src/components/StyledRanklistRenderer.tsx` renders the export dropdown menu with a group title:

```tsx
{
  key: 'export-srk',
  label: '导出为',
  type: 'group',
  children: [
    { key: 'export-srk', label: '标准榜单格式 (srk)', onClick: download },
    { key: 'export-gym-ghost', label: 'Codeforces Gym Ghost (dat)', onClick: exportAsGymGhost },
    { key: 'export-vjudge-replay', label: 'Virtual Judge Replay (xlsx)', onClick: exportAsVJReplay },
    { key: 'export-xlsx', label: 'Excel 表格 (xlsx)', onClick: exportAsGeneralExcel },
  ],
}
```

The product-visible contract is the `导出为` group title above the export actions.

## Current Vue Gap

`src/client/components/rankland-ranklist.vue` currently renders the export menu as four flat `a-menu-item`s. Functionality works, but the menu structure differs from the old Ant Design menu.

## Scope

- Add full-chain coverage that hovering the ranklist export trigger shows a `导出为` group title.
- Wrap the existing export actions in `a-menu-item-group` while preserving their `data-id`s and click handlers.
- Keep export filenames, action status, share menu, and header icons unchanged.
- Update migration status after verification.

## Non-Goals

- Do not change export conversion implementations.
- Do not change share menu structure.
- Do not change collection navigation menu grouping.

## Test Strategy

Use the existing `/ranklist/:id` full-chain route, which already hovers and clicks every export action. Add a single assertion for the group title before the existing hover-open/close helper and download checks. The test should fail before implementation because the group title is absent.

## Acceptance Criteria

- Focused ranklist full-chain test fails before implementation because `导出为` is absent from the export dropdown.
- Focused ranklist full-chain test passes after implementation.
- Existing export download tests remain green.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- `docs/migration/status.md` records this verified slice.
