# User Modal Body Product Class Parity Design

## Context

Old React `rankland-fe/src/components/UserInfoModal.tsx` renders the user modal body root as:

```tsx
return (
  <div className="user-modal">
    ...
  </div>
);
```

The Vue migration already restored the old `.user-modal` class, but it still exposes a migration-only product class:

```vue
<div v-if="activeUserPayload" class="rankland-user-modal-body user-modal">
```

This preserves current selectors and dark text styling, but product DOM parity is incomplete because old React did not render `rankland-user-modal-body`.

## Scope

Restore exact old React class parity for the user modal body root:

- render exact `class="user-modal"`;
- remove Vue-only `rankland-user-modal-body`;
- preserve the modal title and absence of duplicate body name;
- preserve body text color in light and dark themes;
- preserve all existing user modal child nodes, stable child `data-id` hooks, and item-level parity coverage.

## Non-Goals

- Do not change modal root classes such as `srk-react-modal-root`.
- Do not change organization, team, marker, segment, photo/slogan, rank-time, or solution modal behavior.
- Do not add a new body `data-id`; tests can locate the body through the old `.user-modal` class under `[data-id="rankland-ranklist-user-modal"]`.
- Do not remove other Vue-only classes outside the user modal body root.

## Test Strategy

Update `tests/e2e/full-chain/ranklist.spec.ts` before implementation:

- assert the user modal body has exact class list `user-modal`;
- assert the class list does not contain `rankland-user-modal-body`;
- update the body-color helper to locate the body by the old `.user-modal` class;
- keep the existing dark body text color, title/body, and child parity coverage.

Expected RED: the focused Ranklist full-chain test fails because Vue still emits `rankland-user-modal-body user-modal`.

Expected GREEN: the focused test and full Ranklist full-chain file pass after the Vue template removes the migration-only class and scoped styles target the old `.user-modal` class.

## Acceptance Criteria

- The user modal body root renders exact old React `user-modal` class.
- No `rankland-user-modal-body` product class is exposed.
- Light/dark modal body text color remains covered.
- Existing user modal child parity assertions remain green.
- `corepack pnpm test:migration` and `git diff --check` pass before commit.
