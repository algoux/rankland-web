# Global Body Typography Parity Design

## Context

The old React app imports Ant Design's global stylesheet. In `rankland-fe/src/styles/antd.light.css`, the global `body` rule defines:

```css
body {
  margin: 0;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  font-variant: tabular-nums;
  line-height: 1.5715;
  background-color: #fff;
  font-feature-settings: 'tnum';
}
```

The Vue migration already restores the old body text color and RankLand background, but `src/client/index.less` still leaves the global typography on the previous Vue defaults:

```css
font-family: Avenir, Helvetica, Arial, sans-serif;
```

There is no global `font-size`, `line-height`, `font-variant`, or Ant Design system font stack. Any migrated surface that does not set these locally inherits browser/Avenir defaults instead of the old Ant Design baseline.

## Goal

Restore the old Ant Design global body typography baseline in `rankland-web` while preserving the already-restored RankLand light/dark text colors and backgrounds.

## Non-Goals

- Do not change route render methods, route metadata, or generated router outputs by hand.
- Do not change Ant Design Vue component-specific CSS.
- Do not change page-level typography rules that intentionally override body typography, such as SRK headers, home section titles, or modal title styles.
- Do not change focus-mode, theme bootstrap, analytics, or app-shell layout behavior.

## Design

Update `src/client/index.less` global `body` rule to use the old Ant Design body typography:

- `font-size: 14px`
- Ant Design system `font-family`
- `font-variant: tabular-nums`
- `line-height: 1.5715`
- `font-feature-settings: 'tnum'`

Keep the existing RankLand-specific body background behavior:

- default/light background remains `#f2f2f2`
- dark background remains `#14171c`
- light/dark `--rankland-legacy-text-color` variables remain unchanged

## Test Strategy

Extend `tests/e2e/full-chain/app-shell.spec.ts` with a focused computed-style helper for body typography. In the existing system-theme full-chain test, assert:

- body `font-size` is `14px`
- body `line-height` computes to about `22px`
- body `font-family` contains Chromium's computed `system-ui` equivalent for the old `BlinkMacSystemFont` stack and no longer contains `Avenir`
- body `font-variant-numeric` is `tabular-nums`

The RED run should fail before implementation because current Vue CSS computes `16px` and uses the `Avenir` stack.

## Acceptance Criteria

- Focused app-shell full-chain test fails before implementation for the body typography mismatch.
- Focused app-shell full-chain test passes after the minimal global CSS change.
- Full migration gate passes:
  - `corepack pnpm run gen:client-router`
  - `corepack pnpm test:migration`
  - `git diff --check`
- Migration status, manual checklist, and final integration review reflect the verified slice.

## Risks

This is a global typography change and can subtly affect inherited text/layout. The slice is still aligned with old React/Ant Design behavior; the full migration gate and viewport-bound full-chain tests are the safety net for regressions.

One known dependent assertion is the user modal team-member separator. It uses the old React `font-size: 80%`; after restoring the old 14px body baseline, the correct computed size is `11.2px` rather than the previous migration-era `12.8px` inherited from a 16px body.
