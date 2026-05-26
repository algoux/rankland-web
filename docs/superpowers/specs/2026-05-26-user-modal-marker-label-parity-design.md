# User Modal Marker Label Parity Design

## Goal

Restore the old React user modal marker label presentation in the Vue SRK wrapper.

## Old React Baseline

`rankland-fe/src/components/UserInfoModal.tsx` resolves the user's markers and renders each one through SRK's React `MarkerLabel`:

```tsx
<MarkerLabel
  key={marker.id}
  marker={marker}
  theme={theme as EnumTheme}
  className="user-modal-info-marker"
/>
```

`rankland-fe/src/components/UserInfoModal.less` then scopes the user-modal marker box model:

```less
.user-modal-info-markers {
  .user-modal-info-marker {
    border-radius: 4px;
    font-size: 12px;
    border: 1px solid transparent;
    padding: 2px;
    &:not(:last-of-type) {
      margin-right: 4px;
    }
  }
}
```

The old shared renderer stylesheet also maps preset marker styles such as `yellow` to `.srk-preset-marker-yellow`.

## Current Vue Gap

`src/client/components/rankland-ranklist.vue` currently renders user modal markers as generic gray `span.rankland-user-modal-marker` elements. They do not expose a stable `data-id`, do not carry SRK preset marker classes, and use the newer flex/gap/min-height shape instead of the old 2px user-modal label.

## Scope

- Make the full-chain fixture use a preset SRK marker style that maps to old renderer classes while preserving the existing marker id and label.
- Add full-chain coverage for the Team Alpha marker label text, preset class, and old box model.
- Render Vue user modal markers with a stable `data-id` and old `user-modal-info-marker` class.
- Map string marker styles to `srk-preset-marker-*` classes and object marker styles to inline theme-aware text/background colors.
- Restore the old user modal marker CSS without changing rank-time event badge styling.

## Non-Goals

- No changes to user modal slogan, segment labels, photos, team members, or rank-time chart.
- No changes to table-cell marker rendering outside the custom user modal wrapper.
- No generated router changes.

## Test Strategy

Use `/ranklist/:id` full-chain coverage. Open Team Alpha's user modal and assert that the marker label has text `Gold Group`, class `srk-preset-marker-yellow`, 12px font size, 4px radius, 2px padding, and no right margin when it is the last marker.

## Acceptance Criteria

- Focused full-chain test fails before implementation because the stable marker selector/class contract is absent.
- Focused full-chain test passes after implementation.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- `docs/migration/status.md` records this verified slice.
