# App Site Switch CNN Word-Break Parity Design

## Context

The old React `RightMenu` renders different site-switch anchors by site alias:

- `SITE_ALIAS === 'cnn'`: global-site link has no inline `wordBreak` style.
- default China-site link: China-site link uses `style={{ wordBreak: 'keep-all' }}` and renders the two-line China label.

The Vue app currently applies `style="word-break: keep-all;"` unconditionally on `[data-id="app-site-switch-link"]`. That is correct for the default China-site branch, but it leaks a React-absent inline style into the `cnn` global-site branch.

## Goal

Restore the old branch-specific style contract:

- `cnn` branch renders the global-site link without inline `word-break`;
- non-`cnn` branch preserves `word-break: keep-all`;
- href host selection, current path filtering, target `_blank`, omitted `rel`, labels, and arrow icon remain unchanged.

## Non-Goals

- Do not change site-switch host/env precedence.
- Do not change current URL filtering or focus-mode behavior.
- Do not change dropdown trigger/button metrics.
- Do not change Home/SRK beian behavior.

## Test Strategy

Use a source-level unit guard because the default full-chain gate does not boot the app with `SITE_ALIAS=cnn`. The test reads `src/client/App.vue` and verifies the site-switch link uses a bound style instead of unconditional inline `word-break`, and that the computed style contract preserves `cnn ? undefined : { wordBreak: 'keep-all' }`.

Focused RED should fail because the current template still contains `style="word-break: keep-all;"` on the anchor.

Focused GREEN should pass after moving the style into a computed property and binding it on the anchor.
