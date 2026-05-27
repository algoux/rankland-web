# User Modal Empty Organization Line Parity Design

## Goal

Restore old React `UserInfoModal` DOM parity for users without an organization.

## Source Behavior

`rankland-fe/src/components/UserInfoModal.tsx` always renders the organization line as the first body node:

```tsx
<p className="mb-0">{resolveText(user.organization)}</p>
```

When `user.organization` is missing, the old modal still keeps an empty `p.mb-0` node before the unofficial, team, marker, segment, photo, slogan, and rank-time sections.

## Current Vue Gap

`src/client/components/rankland-ranklist.vue` currently guards the organization line with `v-if="activeUserOrganization"`. Users without organization lose the first paragraph node entirely, so the DOM no longer matches the old `UserInfoModal` shape.

## Target Behavior

- The shared Vue SRK user modal always renders `[data-id="rankland-user-modal-organization"]` as the first body line when a user modal is open.
- The line keeps `rankland-user-modal-line`, `rankland-user-modal-organization`, and old `mb-0` class tokens.
- For users with an organization, visible text and existing spacing remain unchanged.
- For users without an organization, the line renders empty text and keeps old zero-margin presentation.

## Non-Goals

- Do not change team member, marker, unofficial, segment, photo, slogan, or rank-time behavior.
- Do not change low-level SRK renderer package output.
- Do not add new route fixtures or mock backend routes.

## Test Strategy

Use `/playground` full-chain coverage because it can preview a deterministic SRK variant without changing shared mock backend fixtures. The test will:

1. load the playground with the welcome modal pre-dismissed;
2. preview the normal ranklist fixture with `Team Alpha` organization removed;
3. open `Team Alpha` from the shared `RanklandRanklist` preview;
4. assert the user modal contains one organization line with empty text, old `mb-0` class, and `0px` top/bottom margins.

The focused test should fail before implementation because the Vue template omits the organization line when the value is empty.

## Acceptance Criteria

- Focused `/playground` full-chain RED fails on the missing empty organization line.
- Focused GREEN passes after removing the conditional organization-line render.
- The existing `/ranklist/:id` user with organization still passes current organization text/class/spacing assertions.
- Full migration gate passes before commit.
- Migration status, manual checklist, and final integration review record the verified empty organization line parity slice.
