# App Site Switch Current URL Parity Design

## Context

Old React `RightMenu` uses `useCurrentUrl()` to build the cross-site switch link. That helper reconstructs the current path from `location.pathname` and `location.query`, filters the control-only query keys `focus` and `聚焦`, and does not include the URL hash.

The Vue shell currently builds `siteSwitchHref` from `this.$route.fullPath`. Vue `fullPath` preserves all query keys and the hash, so a route such as `/search?kw=Test%202024&focus=no&聚焦=否#scoreboard` produces a site switch link containing the focus controls and hash. That differs from the old React product behavior.

## Goal

Restore old React site-switch current URL semantics:

- preserve the current path and non-focus query string for the cross-site link;
- omit query keys `focus` and `聚焦` regardless of value;
- omit URL hash fragments;
- preserve the raw encoding/order of remaining query parameters instead of reserializing them.

## Approach

Add a small App-shell helper that derives the site-switch path from `this.$route.fullPath`:

1. split off any hash fragment;
2. split path and query;
3. filter raw query segments by decoded key, removing `focus` and `聚焦`;
4. join the remaining query segments back without changing their raw encoding;
5. prefix the existing target host.

Do not change focus-mode detection, navigation routes, analytics pageview construction, or SRK share URL normalization.

## Testing

Extend the existing app-shell full-chain test to open a normal route with `kw`, non-activating `focus=no`, `聚焦=否`, and a hash. The expected site-switch link should keep only `kw` and omit both focus controls plus the hash.

Run that focused test as RED before implementation, then run the full migration gate after implementation and docs updates.

## Acceptance Criteria

- Site switch links match old React `useCurrentUrl()` filtering for focus controls.
- Site switch links do not include hash fragments.
- Remaining query parameters keep their existing raw encoding.
- Existing shell/nav/site-switch presentation coverage remains green.
- Full migration gate passes.
