# App shell site switch rel omission parity design

## Context

The old React `RightMenu` renders the site-switch dropdown anchor with `target="_blank"` and no `rel` attribute in both site branches:

```tsx
<a href={`//${process.env.HOST_GLOBAL}${url}`} target="_blank">
  全球站点 <ArrowRightOutlined rotate={-45} />
</a>

<a href={`//${process.env.HOST_CN}${url}`} target="_blank" style={{ wordBreak: 'keep-all' }}>
  ...
</a>
```

The migrated Vue app shell preserves the Ant Design dropdown/button shape, href calculation, current-path carryover, text, and arrow icon, but adds `rel="noreferrer"` to the site-switch anchor. That changes the public DOM and referrer behavior compared with old React.

## Scope

- Restore old omitted `rel` DOM parity for the App shell site-switch anchor:
  - `data-id="app-site-switch-link"`.
- Keep `target="_blank"`, current-route href preservation, site alias host selection, text, arrow icon, Ant Design Vue dropdown/button structure, and app-shell metrics unchanged.

## Non-goals

- Do not change Home/SRK footer external links; they are already handled in separate slices.
- Do not change Playground docs links or any route page content.
- Do not change analytics, theme sync, focus mode, or generated route files.

## Test strategy

- Extend the existing app-shell full-chain test to assert the site-switch link keeps `target="_blank"` and omits `rel`.
- Run the focused app-shell full-chain test and confirm RED before implementation.
- Remove only the Vue-added `rel="noreferrer"` from the site-switch anchor.
- Run the same focused app-shell full-chain test again, then run the full migration gate.

## Acceptance criteria

- The App shell site-switch link matches old React by omitting `rel`.
- Existing site-switch href, text, arrow icon, navigation, layout metrics, focus-mode behavior, and analytics behavior remain green.
- Full migration gate passes.
