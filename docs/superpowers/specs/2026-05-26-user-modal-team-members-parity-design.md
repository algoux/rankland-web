# User Modal Team Members Parity Design

## Goal

Restore the old React user modal team-member presentation in the Vue SRK wrapper.

## Old React Baseline

`rankland-fe/src/components/UserInfoModal.tsx` renders team members before marker labels:

```tsx
{hasMembers && (
  <div className="user-modal-info-team-members mt-2">
    {user.teamMembers!.map((m, mIndex) => (
      <span key={resolveText(m.name)}>
        {mIndex > 0 && <span className="user-modal-info-team-members-slash"> / </span>}
        <span>{resolveText(m.name)}</span>
      </span>
    ))}
  </div>
)}
```

`rankland-fe/src/components/UserInfoModal.less` styles this row as a muted line:

```less
.user-modal-info-team-members {
  opacity: 0.8;
  padding-top: 6px;

  .user-modal-info-team-members-slash {
    opacity: 0.5;
    font-size: 80%;
  }
}
```

## Current Vue Gap

`src/client/components/rankland-ranklist.vue` already renders `activeUserTeamMembers`, but the row uses shared flex/gap styling and a gray separator color. It does not expose stable selectors for the members or slash separator, and it does not restore the old row opacity, padding, separator opacity, or separator 80% font size.

## Scope

- Add deterministic Team Alpha team members to the ranklist full-chain fixture.
- Add full-chain coverage for the team-member text and old computed presentation.
- Add stable `data-id` selectors for the member row, member names, and slash separator.
- Restore the old user-modal team-member CSS without changing rank-time event badge styling.
- Update migration status after verification.

## Non-Goals

- No changes to marker labels, slogan, photo, segment labels, or rank-time chart.
- No changes to SRK table user-cell team member rendering outside the custom user modal.
- No generated router changes.

## Test Strategy

Use `/ranklist/:id` full-chain coverage. Open Team Alpha's user modal and assert that the row contains `Alice / Bob`, has opacity `0.8` and 6px top padding, and that the slash separator has opacity `0.5` and a smaller font size than the row.

## Acceptance Criteria

- Focused ranklist full-chain test fails before implementation because the stable team-member selectors/style contract is absent.
- Focused ranklist full-chain test passes after implementation.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- `docs/migration/status.md` records this verified slice.
