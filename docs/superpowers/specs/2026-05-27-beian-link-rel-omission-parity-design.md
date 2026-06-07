# Beian link rel omission parity design

## Context

The old React frontend uses the shared `BeianLink` component on Home and the SRK footer:

```tsx
<a href="https://beian.miit.gov.cn/" target="_blank">
  {process.env.BEIAN || ''}
</a>
```

Both old call sites are conditional on `process.env.SITE_ALIAS === 'cnn'`, but the anchor itself has `target="_blank"` and no `rel` attribute.

The migrated Vue Home page and shared SRK footer preserve the conditional beian display, href, target, and text, but add `rel="noreferrer"` to the beian anchors. That changes the public DOM and referrer behavior for the China-site footer branch.

## Scope

- Restore old omitted `rel` DOM parity for the conditional beian link in:
  - Home `/` via `data-id="home-beian-link"`.
  - Shared SRK footer via `data-id="rankland-ranklist-beian-link"`.
- Keep the existing `RANKLAND_SITE_ALIAS || SITE_ALIAS` visibility behavior, `BEIAN` text, href, target, footer/home paragraph structure, and spacing unchanged.

## Non-goals

- Do not change the default non-`cnn` site behavior; the beian rows should remain hidden there.
- Do not change app-shell site-switch links, Playground docs links, or other external links.
- Do not change previous Home default visible external-link rel omission parity or SRK footer package/project link parity.
- Do not alter generated route files.

## Test strategy

- Add a conditional full-chain spec that runs only when `RANKLAND_SITE_ALIAS=cnn` or `SITE_ALIAS=cnn`.
- In that spec, render Home and `/ranklist/test-key`, then assert the beian links:
  - are visible;
  - keep `href="https://beian.miit.gov.cn/"`;
  - keep `target="_blank"`;
  - omit `rel`;
  - render the configured `BEIAN` text.
- Run the focused beian full-chain spec with `RANKLAND_SITE_ALIAS=cnn BEIAN=...` and confirm RED before implementation.
- Run the same focused command again after implementation, then run the normal full migration gate.

## Acceptance criteria

- Home and shared SRK footer beian anchors match old React by omitting `rel`.
- Default non-`cnn` full-chain coverage still hides the SRK footer beian row.
- Existing Home, Ranklist, ContactUs, footer, and route behavior remain green.
- Full migration gate passes.
