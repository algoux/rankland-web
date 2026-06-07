# Live Scroll Toggle Text Style Parity Design

## Context

The old React live page renders the scroll-solution control as:

```tsx
<span className="inline-flex items-center">
  <span className="mr-1">实时滚动提交状态</span>
  <Switch defaultChecked={enabledScrollSolution} size="small" onChange={handleSwitchScrollSolution} />
</span>
```

The wrapper has no custom text color or font size, so it inherits the old Ant Design/body text presentation: 14px text and light-mode `rgba(0, 0, 0, 0.85)` color.

The Vue live page currently preserves the 4px spacing and Ant Design Vue small switch, but `.live-scroll-toggle` still overrides the old presentation with `font-size: 13px` and `color: #334155`.

## Goal

Restore the old live scroll-solution toggle text presentation while preserving the existing Switch shape, 4px spacing, query behavior, WebSocket lifecycle, and mobile hiding behavior.

## Non-Goals

- Do not change scroll-solution query semantics.
- Do not change WebSocket setup, reconnect, or close behavior.
- Do not change the Toastify-style realtime event panel.
- Do not change the shared ranklist header/action styling.
- Do not alter mobile hiding behavior.

## Design

Remove the page-specific slate `color` override from `.live-scroll-toggle` so the control inherits the legacy body text color. Set `.live-scroll-toggle` to `font-size: 14px` because the old React app inherited Ant Design's 14px body baseline, while the Vue migration's global body stylesheet currently leaves the browser-default 16px size in place.

Keep `.live-scroll-toggle` as `inline-flex`, keep `align-items: center`, keep `flex-shrink: 0`, and keep `gap: 4px`.

## Test Strategy

Extend the existing `/live/:id` full-chain hydration test to assert `.live-scroll-toggle` computes:

- `font-size: 14px`
- `color: rgba(0, 0, 0, 0.85)`

The test should fail before implementation because the current Vue CSS computes `13px` and `rgb(51, 65, 85)`.

## Acceptance Criteria

- Focused live full-chain test fails before implementation for the custom text style.
- Focused live full-chain test passes after the minimal CSS change.
- Full migration gate passes:
  - `corepack pnpm run gen:client-router`
  - `corepack pnpm test:migration`
  - `git diff --check`
- Migration status, manual checklist, and final integration review reflect the verified slice.

## Risks

The assertion is light-mode specific, matching the full-chain app's default route state. Dark-mode inherited color remains covered by the global body text color and shared SRK header metadata tests.
