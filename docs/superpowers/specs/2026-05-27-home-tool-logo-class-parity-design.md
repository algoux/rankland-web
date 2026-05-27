# Home Tool Logo Class Parity Design

## Context

The old React home page renders both tool-card logos with legacy utility classes:

```tsx
<img className="mr-3 inline-block" ... />
```

The paste.then.ac logo also has inline `width`, `height`, and `padding` styles. The Vue migration currently preserves the visible size, right spacing, and paste logo padding through component-local selectors/classes, but the public DOM no longer carries the old `mr-3 inline-block` class tokens on the tool-card logos.

## Decision

Restore the old logo class tokens while preserving current image-specific hooks:

- Add `mr-3 inline-block` to the paste.then.ac logo and keep `home-card-logo-padded`.
- Add `mr-3 inline-block` to the Algo Bootstrap logo.
- Add home-local `.mr-3` and `.inline-block` utility rules so the restored class tokens carry their old spacing/display semantics.
- Restore `.home-card-title` to block flow instead of Vue-only `inline-flex`, because flex item blockification prevents logo `inline-block` semantics from matching old React `h2` inline content.
- Keep existing image size, paste padding, card links, card copy, SSR data loading, and external-link semantics unchanged.

## Test Strategy

Use the existing home full-chain route test because this is public DOM and visible presentation:

- Probe both tool-card logo images.
- Assert each logo class list contains `mr-3` and `inline-block`.
- Assert each logo computes `display: inline-block` and `margin-right: 12px`.
- Keep the existing paste.then.ac width, height, padding, and margin assertions.
- Verify RED before implementation: current logos do not carry the old class tokens and compute default inline display.
- Verify GREEN after implementation with the focused home full-chain spec.
- Run the full migration gate before committing.

## Acceptance Criteria

- The paste.then.ac and Algo Bootstrap logos render with old React `mr-3 inline-block` class tokens.
- The logos keep 12px right spacing and inline-block display.
- The paste.then.ac logo keeps 24px size and 2px padding.
- Existing card, SSR, contact modal, external link, and viewport coverage remains unchanged.
- Migration status, manual acceptance checklist, and final integration review record this slice.
