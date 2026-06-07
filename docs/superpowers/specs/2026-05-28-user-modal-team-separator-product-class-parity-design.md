# User Modal Team Separator Product Class Parity Design

## Context

Old React `rankland-fe/src/components/UserInfoModal.tsx` renders the team-member separator as:

```tsx
{mIndex > 0 && <span className="user-modal-info-team-members-slash"> / </span>}
```

The Vue SRK wrapper currently keeps that old class, but also exposes a migration-only product class:

```vue
<span
  v-if="memberIndex > 0"
  data-id="rankland-user-modal-team-separator"
  class="rankland-user-modal-team-separator user-modal-info-team-members-slash"
>
```

This preserves the visual style and stable selector, but product DOM parity is incomplete because the old React class list did not include `rankland-user-modal-team-separator`.

## Scope

Restore exact old React class parity for `[data-id="rankland-user-modal-team-separator"]`:

- render exact `class="user-modal-info-team-members-slash"`;
- remove Vue-only `rankland-user-modal-team-separator`;
- preserve raw text content ` / `;
- preserve item-level team-member entry DOM;
- preserve 0.5 opacity and 80% font-size behavior;
- keep stable `data-id` for full-chain assertions and migration diagnostics.

## Non-Goals

- Do not change the team-members row class parity in this slice.
- Do not change the team-member entry wrapper or member-name span DOM.
- Do not change marker, organization, unofficial, segment, slogan, photo, or rank-time nodes.
- Do not remove other migration-only classes outside the team separator.

## Test Strategy

Update `tests/e2e/full-chain/ranklist.spec.ts` before implementation:

- assert `[data-id="rankland-user-modal-team-separator"]` has exact class list `user-modal-info-team-members-slash`;
- assert the class list does not contain `rankland-user-modal-team-separator`;
- keep existing visible text, raw text, entry-DOM, opacity, and font-size coverage.

Expected RED: the focused Ranklist full-chain test fails because Vue still emits `rankland-user-modal-team-separator user-modal-info-team-members-slash`.

Expected GREEN: the focused test and full Ranklist full-chain file pass after the Vue template removes the migration-only class and scoped styles target the stable `data-id` plus old class.

## Acceptance Criteria

- `[data-id="rankland-user-modal-team-separator"]` renders exact old React class tokens.
- Raw separator text remains ` / `.
- Team-member entry DOM remains one outer `span` per member.
- Computed separator style remains 0.5 opacity and 80% font size.
- `corepack pnpm test:migration` and `git diff --check` pass before commit.
