# Collection Empty Heading Class Parity Design

## Context

The old React collection page renders the no-selected-ranklist empty state as:

```tsx
<div data-id="collection-empty-state">
  <h3 className="pt-16 text-center">请展开左侧边栏并选择一个榜单</h3>
</div>
```

The migrated Vue page preserves the visible 64px top spacing and centered text through `.collection-empty-state h3` and parent styles, but the `h3` element itself does not carry the old `pt-16 text-center` class tokens. `docs/migration/status.md` already records `empty-selection h3.pt-16.text-center coverage`, so the implementation and tests should make that statement true at DOM/class level.

## Decision

Restore the old class tokens on the empty-state `h3`:

```vue
<h3 class="pt-16 text-center">请展开左侧边栏并选择一个榜单</h3>
```

Keep the existing `data-id="collection-empty-state"` wrapper and `.collection-empty-state` hook for stable tests and migrated styling. Reuse the route-local `.pt-16` and `.text-center` utility definitions introduced for collection state parity.

## Non-Goals

- Do not change collection navigation, query cleanup, or selected-ranklist behavior.
- Do not remove existing `collection-empty-state` hook.
- Do not broaden this slice into menu pixel parity or SRK table parity.

## Test Strategy

- Extend the existing full-chain empty-state test in `tests/e2e/full-chain/collection.spec.ts`.
- Assert `[data-id="collection-empty-state"] h3` has `pt-16` and `text-center` class tokens, in addition to the existing text and computed spacing assertions.
- RED should fail because the current `h3` has no class attribute.
- GREEN should pass after adding the old class tokens while existing computed CSS assertions continue to pass.

## Acceptance Criteria

- Collection empty-state `h3` carries old React `pt-16 text-center` class tokens.
- Empty-state text, 64px top spacing, centered text, and wrapper `data-id` remain unchanged.
- Focused full-chain collection empty-state test passes.
- Migration dashboard, manual acceptance checklist, and final integration review record the verified DOM/class parity.
