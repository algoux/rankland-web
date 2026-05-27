# Contact QQ Image Class Parity Design

## Context

The old React shared contact modal renders the QQ group image with a legacy Tailwind utility class:

```tsx
<img src={qqGroupImg} className="w-full" />
```

The Vue shared `ContactUs` component already uses Ant Design Vue `Modal`, preserves the stable selectors, and renders the image at full width through local CSS:

```vue
<img data-id="contact-us-qq-image" :src="qqGroupImg" alt="RankLand QQ group">
```

This keeps the visual width but drops the old `w-full` class token. Since the contact modal is shared by Home and SRK footer surfaces, restoring this token improves DOM parity without changing behavior.

## Decision

Add `class="w-full"` to the Vue QQ image while keeping the existing scoped CSS:

```vue
<img data-id="contact-us-qq-image" class="w-full" :src="qqGroupImg" alt="RankLand QQ group">
```

Do not add a global `.w-full` utility in this slice. The current `.contact-us-body img` rule remains the authoritative width styling, and `w-full` is restored as a legacy compatibility token.

## Test Strategy

Use the existing Home full-chain contact modal path because it opens the shared `ContactUs` component through real app rendering, Ant Design Vue modal mounting, and browser DOM assertions.

The RED assertion should fail before implementation because `[data-id="contact-us-qq-image"]` currently has no `w-full` class. The GREEN assertion should pass after adding the class, while existing visibility and Ant Design modal style assertions continue to cover the product behavior.

## Acceptance Criteria

- `[data-id="contact-us-qq-image"]` carries the old `w-full` class.
- The contact modal still opens and closes from the Home page.
- Existing email, QQ image visibility, and Ant Design modal style assertions remain green.
- Migration docs record the verified contact image class parity.
- The full migration gate passes: `gen:client-router`, `test:migration`, and `git diff --check`.

## Non-Goals

- Do not change modal structure, trigger semantics, image asset, or contact copy.
- Do not introduce a global Tailwind utility layer.
- Do not pursue broader contact modal redesign.
