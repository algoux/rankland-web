# Legacy Link Color Parity Design

## Goal

Restore old React/Ant Design themed link colors in the Vue RankLand public surface.

## Old React Baseline

The old React app compiles Ant Design with RankLand theme colors:

- `rankland-fe/src/styles/antd.light.less`: `@primary-color: #ff8104`
- `rankland-fe/src/styles/antd.dark.less`: `@primary-color: #f6ac06`

The generated CSS applies those colors to global links:

```css
a {
  color: #ff8104;
  transition: color 0.3s;
}
a:hover {
  color: #ff9d2e;
}
```

```css
a {
  color: #f6ac06;
  transition: color 0.3s;
}
a:hover {
  color: #a7770b;
}
```

Old `ContactUs` receives an `<a>` child in the ranklist footer, so its trigger also used the same themed link color.

## Current Vue Gap

`src/client/index.less` still used blue link colors (`#2368bf` / `#174f94`) and `contact-us.vue` duplicated the same blue trigger colors. Ant Design Vue reset and component runtime styles could also override the shared SRK wrapper links unless the wrapper scoped its visible link surface.

## Scope

- Add RankLand link color variables for light and dark themes.
- Restore global `a`, `a:hover`, and `a:active` colors to old Ant Design values.
- Restore `ContactUs` link-style trigger colors through the same variables.
- Add SRK wrapper scoped link rules so ranklist reference links and footer contact trigger are stable against Ant Design Vue runtime style ordering.
- Cover light and dark ranklist reference link/contact trigger colors in full-chain E2E.

## Non-Goals

- Do not change route data, SRK parsing, filters, export/share behavior, or generated routes.
- Do not restyle the old non-link `and N more` hidden reference trigger in this slice; old React rendered it as a plain span with pointer cursor.

## Test Strategy

Use `/ranklist/:id` full-chain coverage because it exercises SSR, hydration, theme bootstrap, SRK wrapper header links, and the footer contact trigger. Because old Ant Design links transition color for 0.3s, base color checks should use `expect.poll`.

## Acceptance Criteria

- RED fails before implementation with current blue/inherited colors.
- Focused full-chain ranklist light/dark tests pass after implementation.
- Full ranklist full-chain file passes.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- Migration docs record the verified slice.
