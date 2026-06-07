# Playground Editor Shell Chrome Parity Design

## Goal

Remove Vue-only Monaco editor wrapper chrome from `/playground`.

## Source Behavior

`rankland-fe/src/components/SrkPlayground.tsx` renders `MonacoEditor` directly inside `.srk-playground-container` with:

- `width={500}`;
- `height={remainingHeight}`;
- no custom border;
- no custom border radius.

`rankland-fe/src/components/SrkPlayground.less` only styles the flex container and preview pane. It does not add editor wrapper borders or rounded corners.

## Target Behavior

- `[data-id="playground-editor"]` remains the stable E2E wrapper and Monaco host.
- The editor wrapper computes to `border-top-width: 0px`.
- The editor wrapper computes to `border-radius: 0px`.
- Monaco loading, diagnostics, theme, layout, welcome modal, docs link, invalid JSON prompt, and SRK preview behavior remain unchanged.

## Non-goals

- Do not change Monaco version or loader behavior.
- Do not remove the stable `[data-id="playground-editor"]` selector.
- Do not change Playground mobile layout guards.

## Test Strategy

- Extend the existing full-chain Playground hydration test to assert no editor wrapper border and no radius.
- Verify RED before changing CSS.
- Run focused GREEN, then full migration gate.

## Acceptance

- Focused Playground hydration test fails before implementation because current Vue uses a 1px border and 4px radius.
- Focused Playground hydration test passes after implementation.
- Full migration gate passes:
  `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
