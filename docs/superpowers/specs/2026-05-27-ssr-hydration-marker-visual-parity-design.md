# SSR Hydration Marker Visual Parity Design

## Context

The old React `/ranklist/:id` and `/collection/:id` pages did not render product-visible hydration marker text. The migrated Vue pages keep `data-id` probes for full-chain hydration assertions, but `/ranklist/:id` and `/collection/:id` currently render the probe as normal text. Other migrated CSR pages already keep the same probe hidden from product UI.

## Scope

Restore visual parity by hiding only the existing `ranklist-hydrated` and `collection-hydrated` probes while preserving their text content and selectors for full-chain tests.

## Non-goals

- Do not remove hydration probes.
- Do not change route data loading, SSR/CSR boundaries, generated route files, or SRK rendering.
- Do not alter layout spacing beyond the probe's own 1px hidden box.

## Design

Add route-local classes to the two probe nodes:

- `ranklist-hydrated`
- `collection-hydrated`

Use the established hidden probe style already used by `search-hydrated`, `playground-hydrated`, and `live-hydrated`: `width: 1px`, `height: 1px`, `overflow: hidden`, and `color: transparent`.

## Test Strategy

Update the existing full-chain route tests to assert that the marker still reaches `hydrated` and is visually hidden. Run the focused specs first to verify RED/GREEN, then run the full migration gate.

## Acceptance Criteria

- `/ranklist/:id` still exposes `[data-id="ranklist-hydrated"]` with text `hydrated`.
- `/collection/:id` still exposes `[data-id="collection-hydrated"]` with text `hydrated`.
- Both probes render as a 1px hidden transparent box and no longer appear as product text.
- Full migration gate passes.
