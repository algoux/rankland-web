# Live Scroll Toggle Utility-Class Parity Design

## Goal

Restore the old React `/live/:id` scroll-solution toggle DOM/class contract while preserving the verified product behavior of the migrated Vue live page.

## Source Behavior

Old `rankland-fe/src/pages/live/[id].tsx` rendered the extra action area as:

```tsx
<span className="inline-flex items-center">
  <span className="mr-1">实时滚动提交状态</span>
  <Switch defaultChecked={enabledScrollSolution} size="small" onChange={handleSwitchScrollSolution} />
</span>
```

This means the wrapper carried the legacy Tailwind-style `inline-flex items-center` class tokens, and the 4px text-to-switch spacing came from the label span's `mr-1` class rather than a wrapper `gap`.

## Target Behavior

Current Vue keeps `.live-scroll-toggle` as a stable route/test/mobile-hide hook, but the product DOM should also expose the old class tokens:

- wrapper includes `live-scroll-toggle inline-flex items-center`;
- text span includes `mr-1`;
- wrapper computed display remains `inline-flex`;
- wrapper computed `column-gap` / `row-gap` return `normal`;
- text span computed `margin-right` is `4px`;
- existing switch shape, text color, font size, mobile hiding, route query, polling, and WebSocket behavior remain unchanged.

## Non-Goals

- Do not change shared `RanklandRanklist` controls behavior.
- Do not change live polling, WebSocket reconnect, or scroll-solution toast logic.
- Do not introduce broader utility-class refactors beyond this route-local parity fix.

## Test Strategy

Update the existing full-chain `/live/:id` E2E test because the behavior is DOM/CSS parity visible only after hydration and Ant Design Vue rendering. The RED failure should show the missing old wrapper/text class tokens and current Vue-only wrapper `gap: 4px`. The GREEN run should verify old class tokens and old `mr-1` spacing while preserving the existing switch/font/color assertions.

## Acceptance Criteria

- Focused full-chain live test fails before implementation for the expected old-class/spacing assertions.
- Focused full-chain live test passes after implementation.
- Full migration gate passes with generated routes, build, unit, SSR, shallow E2E, full-chain E2E, and `git diff --check`.
- Migration status, manual acceptance checklist, and final integration review mention this verified slice.
