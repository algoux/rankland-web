# Live Scroll-Solution Parity Design

## Goal

Improve the migrated `/live/:id` scroll-solution panel beyond the foundation list by porting the old React `ScrollSolution` queue timing, visible item limit, result label grouping, and fixed bottom-left toast-like presentation into Vue.

## Source Behavior

The old React component at `rankland-fe/src/components/plugins/ScrollSolution/ScrollSolution.tsx`:

- renders a 250px bottom-left toast container;
- limits visible rows to `floor(containerMaxHeight / 45)` when a max height is provided, otherwise 20 rows;
- pops `FB` rows immediately with a long display delay;
- queues other rows and pops one row per interval;
- accelerates queue draining when the queue length exceeds the visible limit;
- uses result groups: `FB`, `AC`, rejected results, `?`, and fallback `--`;
- displays score, user name, optional organization, problem alias, and result.

## Scope

This slice includes:

- a framework-neutral helper for queue constants, visible limit, result label classes, push behavior, and next-pop calculation;
- focused unit tests that prove `FB` bypasses the queue, crowded queues accelerate pop timing, visible limit follows the old 45px row height, and result classes match legacy groups;
- Vue `LiveScrollSolution` updates to render a fixed bottom-left 250px panel with old row dimensions and result coloring;
- live page wiring that uses the helper instead of prepending every row directly.

## Non-Goals

This slice does not migrate React Toastify, zoom animations, socket.io producer behavior, real WebSocket E2E, or the broader SRK renderer wrapper controls.

## Acceptance Criteria

- `FB` events appear immediately instead of waiting behind queued rejected rows.
- Non-`FB` events drain through a timer using the legacy delay/scale algorithm.
- The visible row cap is 20 by default and can be lowered by the live page's remaining height.
- The rendered panel keeps the ranklist shifted by 250px on desktop while enabled.
- Existing `/live/:id` full-chain coverage still passes and sees scroll-solution status plus rows when stub messages are emitted.
