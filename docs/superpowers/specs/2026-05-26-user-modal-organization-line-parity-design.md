# User Modal Organization Line Parity Design

## Context

The old React `UserInfoModal` renders the user organization as the first body line:

```tsx
<p className="mb-0">{resolveText(user.organization)}</p>
```

Ant Design's base paragraph style sets `margin-top: 0`, and the old `mb-0` utility removes the bottom margin. After the migrated Vue modal title/body cleanup, the organization line is also the first body line, but it still uses the shared `.rankland-user-modal-line` style:

```less
.rankland-user-modal-line {
  margin: 4px 0;
}
```

That leaves an extra 4px top and bottom gap that the old body did not have.

## Decision

Restore the old organization-line spacing by giving the organization line its own class and setting `margin: 0`. Keep the shared `.rankland-user-modal-line` behavior for later lines such as segment display.

## Scope

In scope:

- The organization line inside the shared SRK user modal in `src/client/components/rankland-ranklist.vue`.
- Full-chain `/ranklist/:id` coverage using the existing `Team Alpha` fixture.
- Migration dashboard updates.

Out of scope:

- Unofficial line, team members, marker labels, segment label, photo, slogan, and rank-time chart behavior.
- Modal title and width behavior.
- Any low-level SRK table changes.

## Test Strategy

Add full-chain Playwright coverage to the existing ranklist user modal assertions:

1. Open `/ranklist/test-key?focus=yes`.
2. Click `Team Alpha`.
3. Assert the organization line text is `Org A`.
4. Assert computed `marginTop` and `marginBottom` are both `0px`.

The RED failure should show the current migrated Vue line still has `4px` top and bottom margin.

## Acceptance Criteria

- The organization line displays the selected user's organization.
- The organization line has `margin-top: 0px` and `margin-bottom: 0px`.
- Existing user modal content assertions stay green.
- Required gates pass: `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check`.
- `docs/migration/status.md` records user modal organization-line spacing parity.
