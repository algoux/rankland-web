# User Modal Team Members Class Parity Design

## Goal

Restore the old React user-modal team-members row spacing class in the shared SRK renderer.

## Source Behavior

`rankland-fe/src/components/UserInfoModal.tsx` renders team members as:

```tsx
<div className="user-modal-info-team-members mt-2">
  ...
</div>
```

The old DOM exposes `mt-2` on the team-members container itself. A prior slice already restored the visible team-member text, slash separator, stable selector, and computed `8px` top spacing.

## Target Behavior

- The Vue team-members container keeps `[data-id="rankland-user-modal-team-members"]`, `.rankland-user-modal-team-members`, and `.user-modal-info-team-members`.
- The same container also carries old `mt-2` class token.
- Existing display, opacity, padding, separator styling, and member text behavior remain unchanged.

## Non-goals

- Do not introduce or rely on global utility CSS for `mt-2`; the existing scoped `.rankland-user-modal-team-members` rule remains the style source.
- Do not change team-member data resolution or separator text.
- Do not alter marker rows or other user-modal lines in this slice.

## Test Strategy

- Extend the existing `/ranklist/:id` full-chain user-modal test.
- After opening `Team Alpha`, assert the team-members row still contains `Alice` and `Bob`, still uses `/` as the separator, computes `8px` top margin, and includes old `mt-2` class token.
- Verify RED before implementation.
- Run focused GREEN, then full migration gate.

## Acceptance

- Focused ranklist test fails before implementation because the Vue team-members container lacks `mt-2`.
- Focused ranklist test passes after implementation.
- Full migration gate passes:
  `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
