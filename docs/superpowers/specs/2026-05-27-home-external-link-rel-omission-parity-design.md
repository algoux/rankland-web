# Home external link rel omission parity design

## Context

The old React home page renders its default visible external links with `target="_blank"` and no `rel` attribute:

```tsx
<a href="https://paste.then.ac/?utm_source=rankland" target="_blank">
<a href="https://ab.algoux.cn/?utm_source=rankland" target="_blank">
<a href="https://srk.algoux.org/?utm_source=rankland" target="_blank">
<a href="https://github.com/algoux/srk-collection" target="_blank">
<a href="https://github.com/algoux/standard-ranklist-renderer-component" target="_blank">
<a href="https://github.com/algoux/standard-ranklist-utils" target="_blank">
<a href="https://github.com/algoux/standard-ranklist-convert-to" target="_blank">
<a href="https://github.com/algoux" target="_blank">
<a href="https://algoux.org" target="_blank">
<a href="https://servicestatus.algoux.org" target="_blank">
```

The migrated Vue home page preserves the hrefs, visible text, targets, card layout, and section structure, but adds `rel="noreferrer"` to those anchors. That changes the public DOM and referrer behavior compared with the old React page.

## Scope

- Restore old omitted `rel` DOM parity for the default visible home external links:
  - `https://paste.then.ac/?utm_source=rankland`
  - `https://ab.algoux.cn/?utm_source=rankland`
  - `https://srk.algoux.org/?utm_source=rankland`
  - `https://github.com/algoux/srk-collection`
  - `https://github.com/algoux/standard-ranklist-renderer-component`
  - `https://github.com/algoux/standard-ranklist-utils`
  - `https://github.com/algoux/standard-ranklist-convert-to`
  - `https://github.com/algoux`
  - `https://algoux.org`
  - `https://servicestatus.algoux.org`
- Keep `target="_blank"`, hrefs, text, classes, card chrome, and section layout unchanged.

## Non-goals

- Do not change internal `router-link` recommendations.
- Do not change `ContactUs` trigger markup or modal behavior.
- Do not change conditional beian visibility or site-alias behavior in this slice.
- Do not change app-shell external links or SRK footer links; those are separate parity paths.

## Test strategy

- Extend the main `/` full-chain test to assert each default visible home external link keeps `target="_blank"` and omits `rel`.
- Run the focused home full-chain test and confirm RED before implementation.
- Remove only the Vue-added `rel="noreferrer"` attributes from the scoped home anchors.
- Run the focused home full-chain test again and then the full migration gate.

## Acceptance criteria

- The scoped default visible home external links match old React by omitting `rel`.
- Existing home SSR, layout, cards, ContactUs modal, and API request behavior remain green.
- Full migration gate passes.
