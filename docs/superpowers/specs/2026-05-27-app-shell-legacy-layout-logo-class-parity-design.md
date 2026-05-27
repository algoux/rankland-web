# App Shell Legacy Layout And Logo Class Parity Design

## Context

The old React root layout renders the normal shell with these public DOM/class hooks:

```tsx
<Layout className="layout">
  <Header>
    <div className="flex justify-between" style={{ flex: 1, minWidth: 0 }}>
      <Link to="/">
        <div className="logo">
          <img src={logo} />
        </div>
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <NavMenu />
      </div>
      <RightMenu />
    </div>
  </Header>
  <Content>{children}</Content>
  <BackTop />
</Layout>
```

The Vue shell already restores the Ant Design Vue Layout/Header/Menu/Dropdown/Button/BackTop behavior and measured header/logo/nav/site-switch dimensions, but it uses migrated-only hooks for this part of the DOM:

- root layout class: `app-shell` but not old `layout`;
- header inner class: `app-header-inner` but not old `flex justify-between`;
- logo link contains the image directly, without the old inner `div.logo`.

This slice restores those old shell DOM/class hooks while preserving the migrated test hooks and existing verified box model.

## Decision

- Add `layout` to the root `<a-layout>` class list while preserving `app-shell`.
- Add `flex justify-between` to `.app-header-inner` while preserving `app-header-inner`.
- Add an inner `<div class="logo app-logo-box">` inside the logo link and move the `<img>` into it.
- Add global utility rules for `.flex` and `.justify-between`.
- Add `.layout` and `.logo` rules matching old layout CSS semantics:
  - `.layout { height: 100%; }`
  - `.logo { width: 64px; height: 64px; }`
  - `.logo img { width: 40px; height: 40px; }`
- Keep `.app-logo` as the link-level hook and keep current flex centering/box model so existing viewport and spacing assertions remain stable.
- Do not change route selection, focus-mode bypass, theme sync, analytics, nav menu rendering, site-switch dropdown, or BackTop behavior.

## Test Strategy

Use the existing app-shell full-chain test because this is public app-shell DOM and layout behavior:

- Assert the shell class list includes both Ant Design `ant-layout`, migrated `app-shell`, and old `layout`.
- Probe the header inner class list and computed flex/justify behavior.
- Probe the logo link and inner logo box class lists and computed dimensions.
- Verify RED before implementation: current Vue shell lacks old `layout`, `flex`, `justify-between`, and inner `logo` DOM/class contract.
- Verify GREEN after implementation with the focused app-shell full-chain spec.
- Run the full migration gate before committing.

## Acceptance Criteria

- Root shell includes `layout` without losing `app-shell` or `ant-layout`.
- Header inner includes `flex justify-between` and still computes `display: flex`, `justify-content: space-between`, `min-height: 64px`, and no extra gap.
- Logo link keeps `href="/"`, contains one inner `.logo` box, and the image remains 40px by 40px.
- Existing app shell navigation, site-switch trigger/menu, focus mode, theme, analytics, desktop/mobile bounds, and all public routes remain green.
- Migration status, manual acceptance checklist, and final integration review record this slice.
