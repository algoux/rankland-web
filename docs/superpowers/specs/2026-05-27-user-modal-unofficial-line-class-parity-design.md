# User Modal Unofficial Line Class Parity Design

## Goal

Restore the old React user-modal unofficial-participant spacing classes in the shared SRK renderer.

## Source Behavior

`rankland-fe/src/components/UserInfoModal.tsx` renders the unofficial participant notice as:

```tsx
{user.official === false && <p className="mt-4 mb-0">＊ 非正式参加者</p>}
```

The old DOM exposes `mt-4` and `mb-0` on the notice line itself. A prior slice already restored the visible text, stable selector, and computed `16px` top margin with zero bottom margin.

## Target Behavior

- The Vue unofficial line keeps `[data-id="rankland-user-modal-unofficial"]` and `.rankland-user-modal-unofficial`.
- The same line also carries old `mt-4` and `mb-0` class tokens.
- Existing computed spacing and official/unofficial rendering semantics remain unchanged.

## Non-goals

- Do not introduce or rely on global utility CSS for `mt-4` / `mb-0`; the existing scoped `.rankland-user-modal-unofficial` rule remains the style source.
- Do not change official-only filtering semantics or SRK user data parsing.
- Do not alter unrelated user-modal lines in this slice.

## Test Strategy

- Extend the existing `/ranklist/:id` full-chain user-modal test.
- After opening `Team Beta`, assert the unofficial line text remains `＊ 非正式参加者`, still computes `16px` top margin and `0px` bottom margin, and includes old `mt-4` and `mb-0` class tokens.
- Verify RED before implementation.
- Run focused GREEN, then full migration gate.

## Acceptance

- Focused ranklist test fails before implementation because the Vue unofficial line lacks `mt-4` and `mb-0`.
- Focused ranklist test passes after implementation.
- Full migration gate passes:
  `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
