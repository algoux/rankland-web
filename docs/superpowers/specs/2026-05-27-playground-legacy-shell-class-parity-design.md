# Playground Legacy Shell Class Parity Design

## Context

The old React `SrkPlayground` imports `SrkPlayground.less`, which defines the product shell classes used by the editor/preview layout:

```less
.srk-playground-container {
  display: flex;
  .srk-playground-preview {
    flex: 1;
    overflow-x: auto;
    position: relative;
  }
}
```

The Vue route already restores the layout behavior with `.playground-layout` and `.playground-preview-pane`, but it does not preserve the old class tokens. This leaves a small DOM/class parity gap for the Playground shell.

## Decision

Add the old React class tokens alongside the existing Vue hooks:

- `.playground-layout srk-playground-container` on the layout section;
- `.playground-preview-pane srk-playground-preview` on the preview pane.

Keep all existing styles, data-id selectors, Monaco hooks, preview rendering, mobile no-overflow guard, and tests intact.

## Test Strategy

Update the existing `/playground` hydration full-chain scenario before implementation:

- assert `.playground-layout` has `srk-playground-container`;
- assert `.playground-preview-pane` has `srk-playground-preview`;
- keep existing computed style assertions for `display: flex`, `max-width: none`, and `flex-grow: 1`.

The RED run should fail because the old class tokens are missing.

## Acceptance Criteria

- Focused Playground hydration full-chain test fails before implementation for the missing legacy shell classes.
- Focused Playground hydration full-chain test passes after implementation.
- Full migration gate passes:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

- Migration docs record this verified Playground shell class parity slice.

## Non-Goals

- Do not change Monaco package versions, editor behavior, parse flow, preview flow, or E2E hooks.
- Do not remove existing Vue class hooks.
- Do not change desktop/mobile layout calculations.
- Do not pursue SRK lower-level table pixel parity in this slice.
