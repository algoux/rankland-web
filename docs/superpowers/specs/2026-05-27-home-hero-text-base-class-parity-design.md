# Home Hero Text Base Class Parity Design

## Context

The old React home page renders the introductory copy as:

```tsx
<p className="text-base">
```

The Vue migration currently renders the same copy inside `[data-id="home-hero"] p` without a class. The CSS still produces a 16px paragraph, but product parity audits also track old utility class tokens because they are part of the public DOM and preserve downstream styling hooks.

## Decision

Restore the old `text-base` class token on the home hero paragraph:

- Keep the existing `data-id="home-hero"` wrapper and paragraph copy.
- Add `class="text-base"` to the hero paragraph.
- Keep the existing paragraph color, max width, margin, and line-height.
- Do not change home SSR data loading, JSON-LD, card layout, contact modal behavior, or external link semantics.

## Test Strategy

Use the existing home full-chain route test because this is public SSR DOM:

- Assert `[data-id="home-hero"] p` has the `text-base` class token.
- Keep the existing dark text color assertion on the same paragraph.
- Verify RED before implementation: the paragraph has no class.
- Verify GREEN after implementation with the focused home full-chain spec.
- Run the full migration gate before committing.

## Acceptance Criteria

- Home hero paragraph DOM matches old React `p.text-base`.
- Existing visual typography and dark-mode text color coverage remains unchanged.
- Migration status, manual acceptance checklist, and final integration review record this slice.
