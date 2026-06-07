# App Shell Theme Parity Design

## Context

The old React root layout performs two client-only side effects after mount:

- reads `window.matchMedia('(prefers-color-scheme: dark)')`;
- writes `document.documentElement.className` to `dark` or `light`;
- listens for system color-scheme changes and updates the class;
- adds `body.optimize-decrease-effects` on macOS + Blink to reduce expensive SRK table effects.

The Vue target currently renders the app shell but does not restore either side effect.

## Goal

Restore the old app-shell theme class and platform optimization behavior in the Vue root without adding browser-only work to SSR.

## Scope

- Set `document.documentElement.className` to `dark` or `light` after client mount.
- Update the class when the system color-scheme media query changes.
- Preserve support for both modern `addEventListener('change')` and old `addListener`.
- Add `body.optimize-decrease-effects` when `navigator.userAgent` indicates macOS and Blink.
- Add light/dark global styles for the app shell and keep the existing SRK optimization CSS variable behavior.

## Non-Goals

- Full Ant Design dark theme parity.
- User-facing manual theme switcher.
- ReactGA/pageview parity.
- Pixel-perfect old dark palette.

## Architecture

Implement the client-only side effects in `src/client/App.vue`:

- `mounted()` starts theme sync and scroll listener;
- `beforeUnmount()` removes the media query listener and scroll listener;
- helper methods keep browser API access out of SSR.

Add minimal global CSS in `src/client/index.less`:

- `html.dark` body/app/header/link colors;
- `html.light` and default light colors;
- `.optimize-decrease-effects .srk-main` variables copied from the old React layout intent.

## Test Strategy

Extend `tests/e2e/full-chain/app-shell.spec.ts`:

- force `matchMedia('(prefers-color-scheme: dark)')` to return `matches: true` and assert `html.dark`;
- dispatch a media-query change to false and assert `html.light`;
- set macOS Blink-like user agent and assert `body.optimize-decrease-effects`.

The full-chain harness verifies the behavior after real SSR and hydration.

## Acceptance Criteria

- Dark preference sets `html.dark`.
- Runtime theme changes update `html.light` / `html.dark`.
- macOS Blink user agents add the optimization body class.
- Existing app shell focus and navigation coverage remains green.
- No generated router outputs are edited.
