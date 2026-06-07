# Home Hero Title Inline Style Parity Design

## Context

The old React home page renders the hero title as:

```tsx
<h1 style={{ fontSize: '32px' }}>欢迎来到 RankLand</h1>
```

The Vue migration currently computes the same 32px visual size through scoped CSS:

```less
.home-hero h1 {
  font-size: 32px;
}
```

The visual size is preserved, but the public DOM no longer carries the old inline `font-size: 32px` style. This is a small remaining home page DOM/style parity gap.

## Decision

Restore the old inline style on the home hero title:

- Change the hero title to `<h1 style="font-size: 32px;">欢迎来到 RankLand</h1>`.
- Keep the existing scoped CSS for margin and line-height.
- Do not change the hero copy, SSR data loading, structured data, cards, contact modal, or external links.

## Test Strategy

Use the existing home full-chain route test because this is public DOM and visible presentation:

- Probe the hero title text, inline `style.fontSize`, and computed font size.
- Verify RED before implementation: current title lacks the old inline `font-size` style.
- Verify GREEN after implementation with the focused home full-chain spec.
- Run the full migration gate before committing.

## Acceptance Criteria

- The home hero title renders text `欢迎来到 RankLand`.
- The title has inline `style.fontSize === '32px'`.
- The title computes to `font-size: 32px`.
- Existing home SSR, card, statistics, contact modal, external link, and viewport coverage remains unchanged.
- Migration status, manual acceptance checklist, and final integration review record this slice.
