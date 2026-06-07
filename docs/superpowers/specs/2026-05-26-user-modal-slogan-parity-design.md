# User Modal Slogan Parity Design

## Goal

Restore the old React user modal `x_slogan` presentation in the Vue SRK wrapper.

## Old React Baseline

`rankland-fe/src/components/UserInfoModal.tsx` renders:

```tsx
{slogan && <p className="slogan mt-4 mb-2">{slogan}</p>}
```

`rankland-fe/src/components/UserInfoModal.less` styles it as:

```less
.slogan {
  font-family: 'ZCOOL XiaoWei', serif;
  text-align: center;
  font-size: 32px;

  &::before {
    content: 'SLOGAN';
    display: block;
    font-size: 14px;
  }
}
```

## Current Vue Gap

`src/client/components/rankland-ranklist.vue` renders `activeUserSlogan` as a plain paragraph without a stable selector or the old font, alignment, 32px size, and `SLOGAN` prefix.

## Scope

- Add deterministic `x_slogan` data to the full-chain ranklist fixture.
- Add full-chain coverage for the slogan text and computed presentation.
- Add a stable `data-id` to the Vue slogan element.
- Restore the old slogan CSS contract in the shared user modal.

## Non-Goals

- No changes to user modal segment labels, marker labels, photos, or rank-time chart.
- No font asset migration in this slice; the CSS family contract is restored and can use the font when available.
- No generated router changes.

## Test Strategy

Use `/ranklist/:id` full-chain coverage. Open Team Alpha's user modal, assert that the slogan appears with the old `SLOGAN` pseudo-label, centered 32px text, and `ZCOOL XiaoWei` font-family.

## Acceptance Criteria

- Focused full-chain test fails before implementation because the stable slogan selector/style is absent.
- Focused full-chain test passes after implementation.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- `docs/migration/status.md` records this verified slice.
