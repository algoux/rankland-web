# User Modal Root Class Parity Design

## Goal

Restore the old React user-modal body root class in the shared SRK renderer.

## Source Behavior

`rankland-fe/src/components/UserInfoModal.tsx` renders the modal body as:

```tsx
<div className="user-modal">
```

`UserInfoModal.less` scopes the old modal body styling under `.user-modal`, including segment labels, slogan typography, team-member spacing, and marker label details.

## Target Behavior

- The Vue user modal body keeps the stable `.rankland-user-modal-body` class used by existing tests and dark-text styling.
- The same body element also carries the old `.user-modal` class.
- Existing modal title, organization line, team members, markers, segment, photo, slogan, and rank-time behavior remain unchanged.

## Non-goals

- Do not change modal width, title, close behavior, or SRK `Modal` integration.
- Do not change user-modal child layout or introduce new wrapper nesting.
- Do not change rank-time chart behavior.

## Test Strategy

- Extend the existing `/ranklist/:id` full-chain user-modal test.
- After opening `Team Alpha`, assert `.srk-modal` is visible, the modal title is unchanged, and `.user-modal` is visible inside `[data-id="rankland-ranklist-user-modal"]`.
- Verify RED before implementation.
- Run focused GREEN, then full migration gate.

## Acceptance

- Focused ranklist test fails before implementation because the Vue modal body lacks `.user-modal`.
- Focused ranklist test passes after implementation.
- Full migration gate passes:
  `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
