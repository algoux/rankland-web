# App Site Switch Menu Content Parity Design

## Context

The old React `RightMenu` renders the default site-switch dropdown link as:

```tsx
<a
  href={`//${process.env.HOST_CN}${url}`}
  target="_blank"
  style={{ wordBreak: 'keep-all' }}
>
  <p className="mb-0">中国站点</p>
  <p className="mb-0"><span className="opacity-60 text-xs">特别速度优化</span> <ArrowRightOutlined rotate={-45} /></p>
</a>
```

The Vue migration preserves the visible copy, target, omitted `rel`, and arrow icon, but currently uses Vue-only classes for the two paragraphs and does not carry the old `word-break: keep-all`, `mb-0`, `opacity-60`, or `text-xs` DOM/class contract.

## Decision

Restore the old default site-switch menu content contract while preserving migrated hooks:

- Add `style="word-break: keep-all;"` to the site-switch link.
- Add `mb-0` to both paragraph nodes while keeping `app-site-switch-title` and `app-site-switch-subtitle`.
- Add `opacity-60 text-xs` to the subtitle span.
- Add small global utility rules for `.mb-0`, `.opacity-60`, and `.text-xs` so the restored class tokens carry the old spacing/opacity/font-size semantics.
- Do not change route-aware href construction, `target="_blank"`, omitted `rel`, Ant Design Vue Dropdown/Menu/Button usage, or the `cnn` global-site branch.

## Test Strategy

Use the existing app-shell full-chain test because this is public app-shell DOM and presentation:

- Hover the site-switch button to render the menu.
- Probe the default site-switch link word-break style.
- Probe both paragraph class lists and bottom margins.
- Probe the subtitle span class list, opacity, and font size.
- Verify RED before implementation: current Vue menu content lacks the old class/style tokens.
- Verify GREEN after implementation with the focused app-shell full-chain spec.
- Run the full migration gate before committing.

## Acceptance Criteria

- Default site-switch link keeps the existing route-aware `href`, `target="_blank"`, and omitted `rel`.
- Default site-switch link computes `word-break: keep-all`.
- Title and subtitle paragraphs include old `mb-0` class and compute zero bottom margin.
- Subtitle span includes old `opacity-60 text-xs` classes, computes opacity `0.6`, and font size `12px`.
- Existing shell navigation, theme, analytics, focus mode, and viewport coverage remains unchanged.
- Migration status, manual acceptance checklist, and final integration review record this slice.
