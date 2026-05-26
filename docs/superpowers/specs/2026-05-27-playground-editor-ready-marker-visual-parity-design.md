# Playground Editor Ready Marker Visual Parity Design

## Context

The old React Playground renders the dynamic `SrkPlayground` component and only uses internal `ready` state to decide whether the preview surface should render. It does not show a visible `ready`, `loading`, or `configuring` status label above the Monaco editor.

The Vue migration exposes `[data-id="playground-editor-ready"]` as a stable full-chain selector so tests can wait for Monaco creation. That selector is still useful, but its visible 12px slate text is migration instrumentation, not old product UI.

## Decision

Keep the selector and text content exactly as-is for E2E readiness waits, but visually hide the marker with the same product-safe pattern used for hydration probes:

- `position: absolute`;
- `width: 1px`;
- `height: 1px`;
- `overflow: hidden`;
- `color: transparent`.

Set `.playground-editor-pane` to `position: relative` so the hidden marker is anchored locally and removed from flex layout flow. This avoids adding a visible row or extra flex gap above the editor.

## Non-Goals

- Do not remove or rename `[data-id="playground-editor-ready"]`.
- Do not change Monaco loading, diagnostics, theme, height calculation, Preview action, welcome modal, docs link, or preview rendering.
- Do not change the `/playground` route's CSR render method.

## Test Strategy

Extend the existing Playground full-chain route test that already waits for Monaco and asserts hydration-marker visual hiding. Add computed style assertions for `[data-id="playground-editor-ready"]`:

- text remains `ready`;
- `position` is `absolute`;
- `width` and `height` are `1px`;
- `overflow` is `hidden`;
- `color` is transparent.

Follow TDD: the focused Playground test must fail before implementation because the marker is currently visible static-flow slate text, then pass after the CSS change.

## Acceptance Criteria

- The editor-ready marker remains Playwright-readable.
- The marker is not visible as product UI and does not occupy flex layout space.
- Focused Playground full-chain RED/GREEN is recorded.
- Full migration gate passes.
- Migration status, manual acceptance checklist, and final integration review mention the restored hidden editor-ready marker.
