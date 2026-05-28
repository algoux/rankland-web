# Collection Collapse Button Wrapper DOM Parity Design

## Context

The old React collection route renders the collapse button inside a plain wrapper:

```tsx
<div className="srk-collection-nav" ...>
  <div>
    <Button ...>...</Button>
  </div>
  <Menu ... />
</div>
```

The current Vue route renders the Ant Design Vue button directly under `[data-id="collection-nav"]`. The visible behavior is already covered, but the direct-child DOM contract differs from the old React route shell.

## Goal

Restore the old collection nav collapse button wrapper DOM contract:

- The first direct child of `[data-id="collection-nav"]` is a plain `DIV`.
- That wrapper has no class and no inline style.
- `[data-id="collection-collapse-button"]` remains the direct child of that wrapper.
- Existing collapse behavior, button width transition, icons, menu behavior, mobile collapse, and remaining-height layout remain unchanged.

## Non-Goals

- Do not change collection nav sizing, animation, or collapse state persistence.
- Do not change Ant Design Vue menu rendering or category icons.
- Do not change loaded collection shell, selected ranklist content, or state wrappers.

## Test Strategy

Extend the existing collection full-chain menu test with a DOM helper that inspects `[data-id="collection-nav"]` direct children and the collapse button parent. Focused RED should fail because the current first child is the button itself. Focused GREEN should pass after adding the plain wrapper.

## Acceptance Criteria

- Focused collection menu full-chain test passes.
- Focused collection desktop/mobile bounds test passes.
- The full migration gate passes.
- Migration status, manual acceptance checklist, and final integration review mention the restored collapse button wrapper DOM contract.
