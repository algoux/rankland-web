# Ranklist Header Action Icons Parity Design

## Goal

Restore the old React ranklist header export/share action buttons as Ant Design icon triggers instead of visible text buttons.

## Old React Baseline

`rankland-fe/src/components/StyledRanklistRenderer.tsx` renders the header actions inside `metaBlock` with Ant Design icons:

```tsx
<DownloadOutlined />
<ShareAltOutlined />
```

The icons are the only visible trigger content for the export and share dropdowns.

## Current Vue Gap

`src/client/components/rankland-ranklist.vue` currently renders Ant Design Vue small buttons with visible text:

```vue
<a-button data-id="rankland-ranklist-export-menu-button" size="small">
  导出
</a-button>
<a-button data-id="rankland-ranklist-share-menu-button" size="small">
  分享
</a-button>
```

That preserves functionality, but it is visually different from the old product header.

## Scope

- Add full-chain assertions that the export button contains `.anticon-download` and the share button contains `.anticon-share-alt`.
- Declare `@ant-design/icons-vue` as a direct dependency so Vite SSR can resolve the icons under pnpm.
- Render Ant Design Vue `DownloadOutlined` and `ShareAltOutlined` in the existing buttons.
- Preserve the current `data-id`s, hover dropdown trigger behavior, menu contents, and copy/export actions.
- Add title/aria labels so the icon-only controls remain identifiable.
- Update migration status after verification.

## Non-Goals

- Do not change export/share menu items.
- Do not change copy/download implementations.
- Do not change the surrounding header layout, view count, contributors, or reference links.
- Do not replace the existing Ant Design Vue dropdown/button components.

## Test Strategy

Use the existing `/ranklist/:id` full-chain test that already verifies the header actions and dropdown behavior. Extend it with icon class assertions for both triggers. The test should fail before implementation because the icon spans are absent.

## Acceptance Criteria

- Focused ranklist full-chain test fails before implementation because the icon classes are absent.
- Focused ranklist full-chain test passes after implementation and direct dependency declaration.
- Existing export/share hover and click coverage remains green.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- `docs/migration/status.md` records this verified slice.
