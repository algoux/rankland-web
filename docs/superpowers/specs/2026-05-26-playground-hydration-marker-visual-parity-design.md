# Playground Hydration Marker Visual Parity Design

## Context

The old React Playground route renders the dynamic `SrkPlayground` component or a loading component. It does not render a visible hydration/debug marker.

The Vue Playground route currently renders:

```vue
<div data-id="playground-hydrated" class="playground-hydrated">{{ hydrated ? 'hydrated' : 'csr' }}</div>
```

and styles it as visible 12px muted text in the toolbar. That exposes migration/test instrumentation in product UI. The search and home routes now keep equivalent test markers visually hidden while retaining Playwright-readable text.

## Goal

Hide the `/playground` hydration marker from visible product UI while preserving the existing `data-id="playground-hydrated"` selector and text content for full-chain hydration assertions.

## Scope

- Add full-chain E2E assertions that the Playground hydration marker is visually hidden.
- Update `src/client/modules/playground/playground.view.vue` CSS for `.playground-hydrated`.
- Update migration docs after verification.

## Non-Goals

- Do not remove or rename the hydration marker.
- Do not change Monaco loading, editor height, welcome modal, docs link, preview behavior, or SRK rendering.
- Do not change other route markers in this slice.

## Design

Use the same visual-hidden marker style already used by the home and search routes:

```less
width: 1px;
height: 1px;
overflow: hidden;
color: transparent;
```

This preserves test observability without adding visible product text that did not exist in the old React route.

## Test Strategy

Follow TDD:

1. Extend the existing `/playground` full-chain test that verifies CSR hydration and bundled SRK preview.
2. Add computed CSS assertions for `width`, `height`, `overflow`, and transparent `color`.
3. Run the focused test and confirm RED fails because the current marker is visible.
4. Apply the minimal CSS change, then run focused Playground, full Playground, and full migration gates.

## Acceptance Criteria

- `[data-id="playground-hydrated"]` still has text `hydrated` after CSR mount.
- The marker computes to `width: 1px`, `height: 1px`, `overflow: hidden`, and transparent text color.
- Playground full-chain tests pass.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.

## Risks

- The marker lives inside `.playground-toolbar`, so shrinking it changes the toolbar gap contribution. This aligns with the old React route because there was no visible marker before the title.
