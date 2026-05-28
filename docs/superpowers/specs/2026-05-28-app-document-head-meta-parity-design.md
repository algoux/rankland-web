# App Document Head Meta Parity Design

## Context

The old React app's `src/pages/document.ejs` defines the public HTML document defaults before any route component is hydrated. It uses:

- `<html lang="zh-Hans">`;
- legacy viewport content `width=device-width,initial-scale=1,minimum-scale=0.5,maximum-scale=1.0,user-scalable=yes`;
- RankLand description, keywords, color-scheme, Dark Reader lock, Open Graph, Twitter card, and fallback title metadata.

The Vue migration currently keeps a Vite starter document in `index.html`, including `lang="zh-cmn-Hans"`, a shorter viewport value, and the fallback title `bwcx Demo`. Route components already own route-specific titles and Open Graph titles after SSR/CSR rendering; this slice restores only the static document defaults that should be present before route-specific head output.

## Scope

- Restore the old static document `lang` and head meta defaults in `index.html`.
- Keep the existing `X-UA-Compatible`, favicon, app mount point, module script, and `data-rankland-theme-bootstrap` pre-hydration theme script.
- Add full-chain coverage that fetches raw HTML and checks the static document defaults before app hydration.

## Non-Goals

- Do not change route-specific `<Head>` output in Vue modules.
- Do not change SSR/CSR route metadata or generated router files.
- Do not change app shell layout, theme sync, or hydration scripts.
- Do not add browser-visible UI.

## Test Strategy

Extend `tests/e2e/full-chain/app-shell.spec.ts` with raw HTML assertions:

- HTML tag uses `lang="zh-Hans"`.
- Viewport meta matches the old React exact content string.
- Static description, keywords, color-scheme, Dark Reader lock, Open Graph, Twitter card, and fallback title are present.
- Existing theme bootstrap assertions remain in the same raw HTML path.

The RED failure should show the current Vite document still has the shorter viewport and starter title.

## Acceptance Criteria

- Focused app-shell full-chain test fails before implementation on the legacy document head assertions.
- After implementation, the focused test passes.
- Full app-shell full-chain file passes.
- Full migration gate passes: `gen:client-router`, `test:migration`, and `git diff --check`.
- Migration status and acceptance docs record the slice and keep the review-driven next focus.
