# Live Toastify Parity Design

## Goal

Close the deferred `/live/:id` scroll-solution product gap by matching the old React Toastify container semantics, per-toast DOM shape, and `Zoom` enter animation while keeping the existing Vue queue, WebSocket reconnect, and viewport safety behavior.

## Source Behavior

The old React component at `rankland-fe/src/components/plugins/ScrollSolution/ScrollSolution.tsx` renders:

- `ToastContainer` with `className="plugin_scroll-solution-container"`;
- `position="bottom-left"`, `hideProgressBar`, `closeButton={false}`, `pauseOnHover={false}`, `pauseOnFocusLoss={false}`, `draggable={false}`, and `limit={popLimit}`;
- `transition={Zoom}`, which applies `Toastify__zoom-enter` using `animation-name: Toastify__zoomIn` and a `750ms` enter duration;
- custom Less in `ScrollSolution/index.less` that overrides Toastify defaults to `width: 250px`, `bottom: 0`, `left: 0`, `padding: 0`, `margin-bottom: 0`, `border-radius: 0`, `padding: 0`, `min-height: initial`, and a `45px` row.

## Scope

This slice includes:

- full-chain assertions that the migrated Live scroll-solution panel exposes the legacy Toastify container classes and bottom-left pixel overrides;
- full-chain assertions that each realtime event row exposes the legacy Toastify toast class, body shape, no close button, no progress bar, and Zoom enter animation;
- Vue markup/CSS changes to mimic the React Toastify DOM and animation without adding React or `react-toastify` to the Vue bundle;
- migration status/checklist updates that remove the deferred Toastify product risk.

## Non-Goals

This slice does not change queue timing, WebSocket reconnect behavior, mobile toggle visibility, SRK renderer behavior, or rank-time chart animation parity.

## Acceptance Criteria

- A realtime scroll-solution event renders inside a fixed bottom-left container with legacy Toastify and `plugin_scroll-solution-container` classes.
- The container uses the old custom dimensions: 250px width, zero bottom/left offset, zero padding, and high Toastify z-index.
- Each visible event row has `Toastify__toast Toastify__zoom-enter` semantics, `45px` height, no Toastify close button, and no Toastify progress bar.
- The enter animation resolves to `Toastify__zoomIn` with a `750ms` duration.
- Existing Live full-chain viewport bounds still pass on desktop and mobile.
