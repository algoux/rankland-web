# SRK Share Link Hash Omission Parity Design

## Context

Old React `StyledRanklistRenderer` copies `fullUrl` from `useCurrentUrl()`. That hook rebuilds the URL from `location.pathname` and `location.query`, filters legacy focus-only query keys (`focus` and `聚焦`), and does not include `location.hash`.

The Vue migration already filters the focus-only query keys through `normalizeRanklandShareUrl`, but it currently preserves `url.hash`. That means copying a Ranklist or Live page URL with a fragment can produce a link the old React app would not have copied.

## Goal

Restore old React share-link behavior for SRK header actions: copied page links omit focus-only query keys and omit URL fragments.

## Scope

- Update `normalizeRanklandShareUrl` to return the URL without `#fragment`.
- Keep all non-focus query parameters, their order, pathname, protocol, and host.
- Keep embed iframe generation unchanged; old React intentionally builds embed URLs with `focus=yes`.
- Add focused unit coverage for the helper.
- Add full-chain Ranklist coverage that opens a URL with query and hash, uses the real share menu action, and verifies the copied text.

## Non-Goals

- Do not change export actions, embed code generation, notification copy, or share menu DOM/class parity.
- Do not change Live behavior unless it is naturally covered by the shared helper.
- Do not alter route builders or generated router files.

## Acceptance Criteria

- `normalizeRanklandShareUrl('https://rl.algoux.org/ranklist/test-key?token=t0&focus=yes&聚焦=yes#scoreboard')` returns `https://rl.algoux.org/ranklist/test-key?token=t0`.
- Ranklist full-chain copy-link action copies a URL without `focus`, `聚焦`, or hash while preserving other query parameters.
- Existing embed iframe tests still pass.
- Full migration gate passes before committing.
