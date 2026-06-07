# App Document Body Bootstrap Parity Design

## Context

The old React app's `src/pages/document.ejs` did more than define static meta tags. Before hydration, it also:

- injected a head inline style that set `body` to `margin:0`, light background `#f0f2f5`, `opacity:0`, and `transition:opacity 0.7s cubic-bezier(0.22, 0.61, 0.36, 1)`;
- set the pre-hydration dark background to `#000`;
- removed an already-injected Dark Reader style node with `document.head.querySelector('.darkreader')`.

The old app stylesheet then set `body { opacity: 1; }`, causing the app to fade in after its CSS loads. The Vue migration already restores document head metadata and theme bootstrap, but the raw document still lacks this body bootstrap layer. This leaves more first-frame behavior to Vite/client CSS and is a direct SSR/hydration flicker parity gap.

## Scope

- Restore the old raw document inline body bootstrap style in `index.html`.
- Restore the old Dark Reader cleanup script before the app mount in `index.html`.
- Set `body { opacity: 1; }` in `src/client/index.less` so the inline pre-hydration opacity is released after app CSS loads.
- Extend app-shell full-chain raw HTML and hydrated CSS assertions.

## Non-Goals

- Do not change the Vue app mount element `#app`.
- Do not change route-specific head output, generated routes, or page components.
- Do not change existing theme bootstrap behavior.
- Do not change current final light/dark body background colors after hydration.

## Test Strategy

Extend `tests/e2e/full-chain/app-shell.spec.ts`:

- Raw HTML test asserts the inline old body bootstrap style is present before `<body>`.
- Raw HTML test asserts the Dark Reader cleanup script is present before the app mount.
- Hydrated theme test asserts `body` computes `opacity: 1` after app CSS loads, while existing light/dark background assertions continue to cover final app theme colors.

The RED failure should show the current Vue document lacks the old inline body bootstrap style and cleanup script.

## Acceptance Criteria

- Focused raw HTML app-shell full-chain test fails before implementation on the old body bootstrap assertions.
- After implementation, the focused raw HTML test passes.
- Hydrated app-shell test passes with computed `body` opacity `1`.
- Full app-shell full-chain file passes.
- Full migration gate passes: `gen:client-router`, `test:migration`, and `git diff --check`.
- Migration status and acceptance docs record the slice and keep the review-driven next focus.
