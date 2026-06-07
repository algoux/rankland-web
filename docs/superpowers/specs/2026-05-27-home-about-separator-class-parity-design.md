# Home About Separator Class Parity Design

## Context

The old React home page renders the About section's "其他链接" separator as:

```tsx
<span className="mx-2">|</span>
```

The Vue migration currently renders the same separator as:

```vue
<span class="home-separator">|</span>
```

The visible spacing is preserved through the local `home-separator` rule, but the public DOM no longer carries the old `mx-2` class token. This is a small remaining home page DOM/class parity gap.

## Decision

Restore the old `mx-2` class token on the separator while keeping the existing `home-separator` hook:

- Change the separator to `class="mx-2 home-separator"`.
- Add a home-local `.mx-2` utility rule with `margin-right: 8px` and `margin-left: 8px`.
- Keep `home-separator` for migrated test/style hooks and color inheritance.
- Do not change link hrefs, target/rel behavior, copy, SSR data loading, or page layout.

## Test Strategy

Use the existing home full-chain route test because this is public DOM and visible presentation:

- Probe the About separator text, class tokens, and computed horizontal margins.
- Verify RED before implementation: current separator lacks `mx-2`.
- Verify GREEN after implementation with the focused home full-chain spec.
- Run the full migration gate before committing.

## Acceptance Criteria

- The About section separator renders text `|`.
- The separator class list contains both `mx-2` and `home-separator`.
- The separator computes 8px left and right margins.
- Existing home SSR, external link, contact modal, card, statistics, and viewport coverage remains unchanged.
- Migration status, manual acceptance checklist, and final integration review record this slice.
