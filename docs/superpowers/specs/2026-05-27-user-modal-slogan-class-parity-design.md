# User Modal Slogan Class Parity Design

## Goal

Restore the old React user-modal slogan class in the shared SRK renderer.

## Source Behavior

`rankland-fe/src/components/UserInfoModal.tsx` renders the optional user slogan as:

```tsx
{slogan && <p className="slogan mt-4 mb-2">{slogan}</p>}
```

`UserInfoModal.less` scopes the slogan typography under `.user-modal .slogan`, including the `ZCOOL XiaoWei` font, centered `32px` text, and the `SLOGAN` pseudo-label.

## Target Behavior

- The Vue slogan element keeps the stable `[data-id="rankland-user-modal-slogan"]` selector and `.rankland-user-modal-slogan` class.
- The same slogan element also carries the old `.slogan` class.
- Existing computed typography, pseudo-label, font loading, photo, segment, marker, and rank-time behavior remain unchanged.

## Non-goals

- Do not add old utility spacing classes unless product review requires exact utility-class DOM parity later.
- Do not move the slogan into a new wrapper.
- Do not change modal title, body root, rank-time chart, or asset rendering behavior.

## Test Strategy

- Extend the existing `/ranklist/:id` full-chain user-modal test.
- After opening `Team Alpha`, assert the slogan text remains `Keep moving forward` and the slogan element has the old `.slogan` class.
- Keep the existing computed-style checks for typography and pseudo-label.
- Verify RED before implementation.
- Run focused GREEN, then full migration gate.

## Acceptance

- Focused ranklist test fails before implementation because the Vue slogan element lacks `.slogan`.
- Focused ranklist test passes after implementation.
- Full migration gate passes:
  `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
