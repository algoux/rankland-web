# Live Scroll-Solution Reload Parity Design

## Context

The old React Live page toggles scroll-solution mode by waiting 250 ms, editing `window.location.search`, and letting the browser perform a full page navigation:

- enabling appends `scrollSolution=1` to `URLSearchParams(window.location.search)`;
- disabling deletes `scrollSolution`;
- assignment to `window.location.search` preserves the browser-level reload semantics.

The Vue Live page currently mutates `$route.query` and calls `$router.replace`. That preserves the visible URL and reloads data through the route watcher, but it is not the same product/runtime behavior as the old React page.

## Goal

Restore the old Live scroll-solution toggle navigation contract:

- toggle changes are delayed by 250 ms;
- query edits use `URLSearchParams(window.location.search)`;
- the final transition assigns `window.location.search`;
- non-scroll-solution query keys remain preserved;
- scroll-solution UI disappears after disabling because the page reloads without `scrollSolution=1`.

## Non-Goals

- Do not change WebSocket reconnect behavior outside the toggle path.
- Do not change Live polling, ranklist rendering, scroll-solution rendering, or mobile no-toggle behavior.
- Do not change route builders or generated route files.
- Do not add a new shared routing abstraction for this single old React behavior.

## Test Strategy

Update the existing full-chain Live scroll-solution toggle test. It already verifies query preservation and the disabled UI state. Add a page-level `beforeunload` counter installed with `page.addInitScript`; after clicking the toggle, the test should assert:

- the URL becomes `/live/live-test-key?token=t0&focus=yes`;
- the scroll-solution panel is hidden after the new page load;
- the beforeunload counter is `1`, proving a browser navigation happened instead of SPA-only `$router.replace`.

The focused RED should fail on the current Vue implementation because `$router.replace` changes URL without firing `beforeunload`.
