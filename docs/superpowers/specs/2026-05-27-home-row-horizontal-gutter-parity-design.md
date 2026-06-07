# Home Row Horizontal Gutter Parity Design

## Context

The old React home page renders both recommendation/tool card rows as:

```tsx
<Row gutter={16}>
```

Ant Design React `gutter={16}` applies horizontal column gutter only. Vertical spacing in the old page comes from each `Col className="mb-4"`.

The Vue migration currently renders both rows as:

```vue
<a-row :gutter="[16, 16]" style="margin-left: 0; margin-right: 0;">
```

Ant Design Vue turns the second tuple entry into `row-gap: 16px`, which adds vertical row spacing on top of the restored `mb-4` column margin. This is a concrete product spacing difference from old React.

## Decision

Restore old horizontal-only row gutter behavior:

- Change both home card rows from `:gutter="[16, 16]"` to `:gutter="16"`.
- Keep the existing inline `margin-left: 0; margin-right: 0;` guard to preserve current no-horizontal-overflow coverage.
- Keep all four `a-col class="mb-4"` class tokens and their 16px bottom margin.
- Do not change card content, card links, icons, logos, SSR statistics loading, JSON-LD, contact modal behavior, or external link semantics.

## Test Strategy

Use the existing home full-chain route test because this is public DOM/layout behavior:

- Probe the two card `.ant-row` elements under `home-recommendations` and `home-tools`.
- Assert their computed `rowGap` is `normal`, matching horizontal-only gutter behavior.
- Keep existing column `mb-4` and 16px bottom margin assertions.
- Verify RED before implementation: current rows compute `rowGap: 16px`.
- Verify GREEN after implementation with the focused home full-chain spec.
- Run the full migration gate before committing.

## Acceptance Criteria

- Home recommendation/tool rows use horizontal-only Ant Design gutter.
- The rows do not emit an extra 16px vertical row gap.
- The four card columns keep old `mb-4` class tokens and 16px bottom spacing.
- Existing visual, SSR, API, contact modal, external link, and viewport coverage remains unchanged.
- Migration status, manual acceptance checklist, and final integration review record this slice.
