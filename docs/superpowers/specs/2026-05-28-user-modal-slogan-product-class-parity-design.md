# User Modal Slogan Product Class Parity Design

## Context

Old React `rankland-fe/src/components/UserInfoModal.tsx` renders the user slogan as:

```tsx
{slogan && <p className="slogan mt-4 mb-2">{slogan}</p>}
```

The Vue SRK wrapper currently keeps those old classes, but also exposes a migration-only product class:

```vue
<p
  v-if="activeUserSlogan"
  data-id="rankland-user-modal-slogan"
  class="rankland-user-modal-slogan slogan mt-4 mb-2"
>
```

This preserves the visual style, but product DOM parity is incomplete because the old React class list did not include `rankland-user-modal-slogan`.

## Scope

Restore exact old React class parity for `[data-id="rankland-user-modal-slogan"]`:

- render exact `class="slogan mt-4 mb-2"`;
- remove Vue-only `rankland-user-modal-slogan`;
- preserve slogan text `Keep moving forward`;
- preserve the old photo/slogan shared wrapper relationship;
- preserve centered 32px ZCOOL XiaoWei text, `SLOGAN` pseudo-label, 16px top margin, and 8px bottom margin;
- keep stable `data-id` for full-chain assertions and migration diagnostics.

## Non-Goals

- Do not change the photo/slogan shared wrapper class parity in this slice.
- Do not change photo image width or broken-image behavior.
- Do not change segment label, segment line, marker, unofficial, team member, organization, or rank-time rows.
- Do not remove other migration-only classes outside the slogan node.

## Test Strategy

Update `tests/e2e/full-chain/ranklist.spec.ts` before implementation:

- assert `[data-id="rankland-user-modal-slogan"]` has exact class list `slogan mt-4 mb-2`;
- assert the class list does not contain `rankland-user-modal-slogan`;
- keep existing text, shared-wrapper, typography, pseudo-label, spacing, and font-loaded coverage.

Expected RED: the focused Ranklist full-chain test fails because Vue still emits `rankland-user-modal-slogan slogan mt-4 mb-2`.

Expected GREEN: the focused test and full Ranklist full-chain file pass after the Vue template removes the migration-only class and scoped styles target the stable `data-id` plus old class.

## Acceptance Criteria

- `[data-id="rankland-user-modal-slogan"]` renders exact old React class tokens.
- Slogan text remains `Keep moving forward`.
- The slogan remains inside the same old photo/slogan wrapper used by the photo node.
- Computed slogan style remains centered 32px ZCOOL XiaoWei text with `SLOGAN` pseudo-label, 16px top margin, and 8px bottom margin.
- `corepack pnpm test:migration` and `git diff --check` pass before commit.
