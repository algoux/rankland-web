# Playground Flex Layout Parity Design

## Goal

Restore the old React Playground desktop layout contract: a flex container with a 500px Monaco editor and a `flex: 1` preview pane.

## Source Behavior

`rankland-fe/src/components/SrkPlayground.tsx` renders:

- `.srk-playground-container` with inline `height: ${remainingHeight}px`;
- `MonacoEditor` with `width={500}` and `height={remainingHeight}`;
- `.srk-playground-preview` as the sibling preview pane.

`rankland-fe/src/components/SrkPlayground.less` sets:

- `.srk-playground-container { display: flex; }`
- `.srk-playground-preview { flex: 1; overflow-x: auto; position: relative; }`

There is no old page-level max-width wrapper and no grid gap between editor and preview.

## Target Behavior

- Desktop `/playground` renders `.playground-layout` as `display: flex`.
- The layout has no `max-width` cap.
- The editor pane has the old fixed `500px` width.
- The preview pane grows with `flex-grow: 1`, keeps `overflow-x: auto`, and remains `position: relative`.
- The layout receives the existing `remainingHeight` value so the container follows the old height contract.
- The existing mobile viewport no-horizontal-overflow protection remains in place through a narrow-screen column override.

## Non-goals

- Do not change Monaco loader/version, diagnostics, theme, welcome modal, docs link, parser behavior, invalid JSON copy, preview wrapper spacing, or SRK renderer behavior.
- Do not claim exact old mobile overflow behavior; mobile keeps the migrated no-overflow guard because the current product gate requires it.

## Test Strategy

- Add full-chain Playwright assertions to the existing Playground hydration test for desktop layout CSS.
- Keep the existing desktop/mobile viewport bounds test to catch regressions from the flex change.
- Run focused RED/GREEN, then the full migration gate.

## Acceptance

- Focused Playground hydration test fails before implementation because current Vue still uses CSS grid and `max-width: 1280px`.
- Focused Playground hydration test passes after implementation.
- Playground desktop/mobile viewport test passes after implementation.
- Full migration gate passes:
  `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
