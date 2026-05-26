# Live Hydration Marker Visual Parity Design

## Context

Old React `rankland-fe/src/pages/live/[id].tsx` renders the live ranklist content, scroll-solution controls, and realtime solution panel without any visible `hydrated` or `csr` diagnostic text.

The Vue migration keeps `data-id="live-hydrated"` as a deterministic CSR hydration probe for full-chain tests. Before this slice, the marker is styled as centered 12px gray text inside the live content area, which makes an internal test marker visible as product UI.

## Decision

Keep the marker in the DOM for testability, but make it visually hidden:

- fixed `1px` width and height;
- `overflow: hidden`;
- transparent text color;
- no change to the `hydrated` / `csr` text contract used by tests.

This matches the existing search and playground marker pattern and preserves route behavior while removing non-product text from the visible live page.

## Scope

In scope:

- `/live/:id` visible hydration marker parity;
- focused full-chain coverage on the main live hydration test;
- migration status, manual checklist, and integration review updates.

Out of scope:

- live data loading, polling, WebSocket reconnect, scroll-solution queueing, and SRK rendering changes;
- generated router changes;
- visual redesign.

## Acceptance Criteria

- The focused live full-chain hydration test fails before implementation because the marker is not visually hidden.
- The same focused test passes after implementation and still reads `hydrated`.
- The full live full-chain spec passes.
- The full migration gate passes with Node 24 and pnpm 8.
- Documentation records the restored hidden hydration marker behavior.
