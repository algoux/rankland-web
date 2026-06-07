# Live Toastify Parity Implementation Plan

Implement Toastify DOM/CSS/animation parity for the migrated `/live/:id` scroll-solution panel.

## Tasks

- [x] Add full-chain RED coverage for legacy Toastify container classes, pixel overrides, hidden close/progress affordances, and Zoom enter animation.
- [x] Update `src/client/modules/live/live-scroll-solution.vue` markup to expose legacy Toastify container, toast, body, and row classes while preserving existing `data-id` hooks.
- [x] Add scoped CSS for Toastify v6 bottom-left overrides and `Toastify__zoomIn` keyframes.
- [x] Run focused Live full-chain tests.
- [x] Run `gen:client-router`, `test:migration`, and `git diff --check`.
- [x] Update migration status/checklist docs.
