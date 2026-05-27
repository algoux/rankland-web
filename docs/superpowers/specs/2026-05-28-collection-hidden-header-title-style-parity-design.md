# Collection Hidden Header Title Style Parity Design

## Context

The old React collection page renders the sticky hidden header title as:

```tsx
<h3
  className="mb-0"
  style={{ fontSize: collapsed ? '14px' : undefined, marginLeft: collapsed ? '0' : '8px' }}
>
  榜单合集
</h3>
```

The migrated Vue page already restores the old wrapper DOM and class names, but the title still has Vue-only title styling:

```vue
<h3
  class="mb-0"
  :style="{
    fontSize: collapsed ? '14px' : undefined,
    marginLeft: collapsed ? '0px' : '8px',
    marginTop: collapsed ? '4px' : '0px',
  }"
>
```

The scoped CSS also forces:

```less
.srk-collection-hidden-header h3 {
  line-height: 1;
}
```

Those two differences move the hidden title away from the old Ant Design/Tailwind heading contract. This is a small route-polish slice, not a broad collection layout rewrite.

## Goal

Restore the old React `.srk-collection-hidden-header h3.mb-0` title style contract while preserving existing collection navigation behavior.

## Scope

- Remove the Vue-only inline `marginTop` from the hidden header title.
- Remove the Vue-only route-local `line-height: 1` override.
- Keep the old `class="mb-0"` title class.
- Keep the old collapsed `fontSize: 14px` and `marginLeft: 0px`.
- Keep the old expanded `marginLeft: 8px`.
- Preserve nav collapse, mobile collapse, remaining-height calculation, and selected-ranklist rendering.

## Non-Goals

- Do not change collection menu items, icons, collapse state persistence, ranklist selection, or fetch behavior.
- Do not broaden into SRK table pixel parity.
- Do not change Ant Design Vue menu rendering or SSR/client-only menu decisions.
- Do not hand-edit generated router outputs.

## Test Strategy

Use `tests/e2e/full-chain/collection.spec.ts` because the hidden header title is public DOM/CSS behavior visible only in the browser after Ant Design styles and scoped Vue CSS are applied.

Focused RED:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders the legacy Ant Design collection menu with category icons"
```

Expected initial failure: current Vue reports inline `marginTop` as `0px` or `4px`, and the computed line-height is equal to the title font size because of the scoped `line-height: 1` rule.

Focused GREEN: the same command passes after removing the Vue-only title margin-top and line-height override.

Full gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- `.srk-collection-hidden-header h3.mb-0` has no inline `marginTop` in expanded or collapsed states.
- `.srk-collection-hidden-header h3.mb-0` keeps inline `marginLeft: 8px` expanded and `marginLeft: 0px` collapsed.
- Collapsed title keeps inline `fontSize: 14px`.
- Computed title line-height is greater than computed font-size, proving the Vue-only `line-height: 1` override is gone.
- Existing collection full-chain behavior remains green.
- Migration status, manual checklist, and final integration review record the verified slice and gate evidence.
