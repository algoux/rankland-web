# SRK footer external link rel omission parity design

## Context

The old React `StyledRanklistRenderer` footer renders its three package/project external links with `target="_blank"` and no `rel` attribute:

```tsx
<a href="https://github.com/algoux" target="_blank">GitHub</a>
<a href="https://github.com/algoux/standard-ranklist" target="_blank">Standard Ranklist</a>
<a href="https://github.com/algoux/srk-collection" target="_blank">榜单合集</a>
```

The migrated Vue footer preserves the text, hrefs, target, footer classes, and spacing, but adds `rel="noreferrer"` to these three anchors. That changes the public DOM and referrer behavior compared with old React.

## Scope

- Restore the old omitted `rel` attribute for the three SRK footer package/project links:
  - `https://github.com/algoux`
  - `https://github.com/algoux/standard-ranklist`
  - `https://github.com/algoux/srk-collection`
- Keep `target="_blank"`, hrefs, text, footer root/paragraph utility classes, contact trigger behavior, link colors, and spacing unchanged.

## Non-goals

- Do not change SRK header contributor links or reference links; those are already restored in separate slices.
- Do not change the conditional beian link; it is controlled by the footer beian parity path and intentionally keeps its current `rel` contract.
- Do not change `ContactUs` markup or behavior.

## Test strategy

- Extend the main `/ranklist/:id` full-chain test to assert the three footer external links keep `target="_blank"` and have no `rel` attribute.
- Run the focused ranklist full-chain test and confirm RED before implementation.
- Run the focused test again after implementation.
- Run the full migration gate before commit.

## Acceptance criteria

- The three footer package/project external links match old React by omitting `rel`.
- Existing footer text, paragraph spacing, contact modal, link colors, beian behavior, and route behavior remain green.
- Full migration gate passes.
