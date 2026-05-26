# User Modal Dark Text Color Parity Design

## Goal

Restore old React user modal body text color behavior in RankLand dark theme.

This covers the shared SRK user info modal opened from `/ranklist/:id`, `/collection/:id`, and `/live/:id` through `RanklandRanklist`.

## Old React Baseline

`rankland-fe/src/components/UserInfoModal.tsx` renders the modal body as:

```tsx
<div className="user-modal">
  <p className="mb-0">{resolveText(user.organization)}</p>
  ...
</div>
```

`rankland-fe/src/components/UserInfoModal.less` styles segment labels, markers, team members, and slogan, but does not set a custom text color for `.user-modal`.

Old Ant Design dark modal styles set the modal header and inherited body text color to the dark body text color:

- light: `rgba(0, 0, 0, 0.85)`;
- dark: `rgba(255, 255, 255, 0.85)`.

Because the old user modal body does not override `color`, body content inherits the active modal/theme text color.

## Current Vue Gap

`src/client/components/rankland-ranklist.vue` currently hard-codes:

```less
.rankland-user-modal-body {
  color: #1f2937;
}
```

This keeps user modal body text dark in RankLand dark theme. The existing dark theme full-chain coverage verifies the low-level SRK table and header link colors, but it does not open the user modal and assert modal body text color.

## Scope

- Add dark-theme full-chain coverage that opens the user modal and checks body text color.
- Point `.rankland-user-modal-body` at the old Ant Design inherited text color variable.
- Preserve existing user modal spacing, responsive width, marker label, segment label, slogan, photo, and rank-time behavior.
- Preserve the light theme body text color through the same variable.

## Non-Goals

- Do not change SRK modal package CSS, modal geometry, animations, or mask styles.
- Do not change Ant Design Vue global modal theme behavior in this slice.
- Do not change low-level SRK table pixel parity.
- Do not touch generated router files.

## Test Strategy

Extend `tests/e2e/full-chain/ranklist.spec.ts`:

- In the existing dark theme route test, click `Team Alpha` and assert the opened user modal body color is `rgba(255, 255, 255, 0.85)`.
- Keep the existing dark table/header assertions in the same route test.
- RED should fail because current Vue returns `rgb(31, 41, 55)`.
- GREEN should pass after `.rankland-user-modal-body` uses `var(--rankland-legacy-text-color)`.

## Acceptance Criteria

- Focused dark ranklist full-chain test fails before implementation with the expected user modal body text-color mismatch.
- Focused dark ranklist full-chain test passes after implementation.
- Full ranklist full-chain spec remains green.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- Migration docs record this verified slice.
