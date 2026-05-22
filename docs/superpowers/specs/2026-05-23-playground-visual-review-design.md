# Playground Visual Review Design

## Context

Home, search, ranklist, collection, live, and the app shell have visual or layout coverage in different slices. `/playground` still has route foundation coverage but no desktop/mobile screenshot review.

The old React page uses a richer editor experience. The Vue target currently preserves the core SRK preview workflow with a textarea-backed editor. Monaco/editor exact parity remains a product/UX polish item.

## Goal

Add focused visual/layout review for the `/playground` CSR route.

## Scope

- Capture desktop and mobile screenshots for `/playground`.
- Assert no page-level horizontal overflow.
- Assert editor, preview pane, preview action, and rendered preview wrapper stay inside viewport bounds.
- Preserve the existing no-upstream-call route behavior.

## Non-Goals

- Implement Monaco.
- Pixel snapshot comparison.
- Rework playground information architecture.
- Validate every SRK renderer visual detail inside the preview table.

## Architecture

Extend `tests/e2e/full-chain/playground.spec.ts` with local layout helpers and screenshots. Fix route CSS only if the new assertions expose actual overflow or out-of-bounds controls.

## Acceptance Criteria

- Playground desktop/mobile screenshots are produced.
- The route hydrates before screenshots.
- Editor and preview controls fit the tested viewport.
- No page-level horizontal overflow is detected.
- Existing playground behavior assertions still pass.
