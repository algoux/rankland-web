# Home Card Col mb-4 Class Parity Design

## Context

The old React home page renders all recommendation/tool card columns as:

```tsx
<Col className="mb-4" xs={24} sm={12}>
```

The Vue migration currently renders the four matching Ant Design Vue columns without the old `mb-4` class token and uses vertical row gutter instead:

```vue
<a-col :xs="24" :sm="12">
```

The visible card grid is already broadly covered, but product-level parity also tracks public utility class tokens and their spacing semantics.

## Decision

Restore the old `mb-4` class token on the four home recommendation/tool columns:

- Add `class="mb-4"` to both recommendation `a-col` nodes.
- Add `class="mb-4"` to both tool `a-col` nodes.
- Add a home-local `.mb-4 { margin-bottom: 16px; }` utility rule because this route's scoped CSS does not inherit a global utility definition.
- Keep existing `data-id` hooks on child links, routes, card content, icons, logos, and external link semantics.
- Keep the current row gutter configuration so existing desktop/mobile overflow checks remain stable.
- Do not change SSR statistics loading, JSON-LD, contact modal behavior, or card copy.

## Test Strategy

Use the existing home full-chain route test because this is public DOM and spacing:

- Probe the closest `.ant-col` ancestor of each card link.
- Assert all four card columns include the `mb-4` class token.
- Assert the computed `margin-bottom` remains `16px`, matching the legacy utility class.
- Verify RED before implementation: current columns do not include `mb-4`.
- Verify GREEN after implementation with the focused home full-chain spec.
- Run the full migration gate before committing.

## Acceptance Criteria

- The four recommendation/tool columns render with old React `mb-4` class tokens.
- The columns keep 16px bottom margin and existing card/link behavior.
- Existing visual, SSR, API, contact modal, external link, and viewport coverage remains unchanged.
- Migration status, manual acceptance checklist, and final integration review record this slice.
