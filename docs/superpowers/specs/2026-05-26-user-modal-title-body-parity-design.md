# User Modal Title Body Parity Design

## Context

The old React SRK user modal renders the user name through the surrounding `Modal` title. Its `UserInfoModal` body starts with the organization line and does not repeat the user name as a body heading.

The migrated Vue `rankland-ranklist.vue` already passes `activeUserTitle` to the shared SRK `Modal`, but the custom body also renders:

```vue
<h3 data-id="rankland-user-modal-name" class="rankland-user-modal-name">{{ activeUserTitle }}</h3>
```

That creates a visible duplicate name in the modal: once in the header title and once in the body.

## Decision

Remove the duplicate body heading from the Vue user modal. Keep the `Modal` title unchanged so the accessible dialog title and visual header still show the user name.

## Scope

In scope:

- Shared SRK user modal in `src/client/components/rankland-ranklist.vue`.
- Full-chain ranklist coverage for the user modal.
- Migration status documentation.

Out of scope:

- Rank-time chart behavior.
- User organization, team members, marker labels, segment, photo, slogan, and unofficial line behavior.
- Solution modal title/body behavior.

## Test Strategy

Add a full-chain Playwright assertion to the existing `/ranklist/:id` user modal coverage:

1. Open `/ranklist/test-key?focus=yes`.
2. Click `Team Alpha`.
3. Assert the SRK modal title remains `Team Alpha`.
4. Assert `[data-id="rankland-user-modal-name"]` is absent.

The RED failure should show that the current Vue body still renders the duplicate heading.

## Acceptance Criteria

- User modal header title still displays the selected user name.
- User modal body does not include a duplicate user-name heading.
- Existing user-modal content parity assertions remain green.
- Required gates pass: `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check`.
- `docs/migration/status.md` records the user modal title/body parity slice.
