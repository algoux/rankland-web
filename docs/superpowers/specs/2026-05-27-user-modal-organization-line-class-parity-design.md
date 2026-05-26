# User Modal Organization Line Class Parity Design

## Goal

Restore the old React user-modal organization line spacing class in the shared SRK renderer.

## Source Behavior

`rankland-fe/src/components/UserInfoModal.tsx` renders the organization line as:

```tsx
<p className="mb-0">{resolveText(user.organization)}</p>
```

The old DOM exposes `mb-0` on the organization line itself. A prior slice already restored the visible organization text, stable selector, and computed zero top/bottom margin.

## Target Behavior

- The Vue organization line keeps `[data-id="rankland-user-modal-organization"]`, `.rankland-user-modal-line`, and `.rankland-user-modal-organization`.
- The same line also carries old `mb-0` class token.
- Existing computed spacing and organization text behavior remain unchanged.

## Non-goals

- Do not introduce or rely on global utility CSS for `mb-0`; the existing scoped `.rankland-user-modal-organization` rule remains the style source.
- Do not change organization fallback or text resolution.
- Do not alter unrelated user-modal lines in this slice.

## Test Strategy

- Extend the existing `/ranklist/:id` full-chain user-modal test.
- After opening `Team Alpha`, assert the organization line text remains `Org A`, still computes `0px` top margin and `0px` bottom margin, and includes old `mb-0` class token.
- Verify RED before implementation.
- Run focused GREEN, then full migration gate.

## Acceptance

- Focused ranklist test fails before implementation because the Vue organization line lacks `mb-0`.
- Focused ranklist test passes after implementation.
- Full migration gate passes:
  `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
