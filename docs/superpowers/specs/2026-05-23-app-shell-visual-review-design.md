# App Shell Visual Review Design

## Context

The Vue app shell now covers the legacy header, nav, right menu/site switch, focus mode, contact modal, BackTop, and theme synchronization behaviors. The migration final gate still requires Playwright visual/screenshot review for key pages to confirm there is no obvious layout breakage, overlap, blank render, or mobile unusability.

## Goal

Add a focused full-chain visual review for the global app shell on desktop and mobile viewports.

## Scope

- Capture desktop and mobile screenshots through the real full-chain app.
- Assert the global shell renders within the viewport.
- Assert header controls remain within the viewport.
- Assert the document does not create horizontal page overflow.
- Assert BackTop appears after scrolling a long page and stays within the viewport.

## Non-Goals

- Pixel snapshot comparison.
- Exact Ant Design header/menu styling.
- Full per-page visual review for every public route.
- Browser matrix beyond the existing Chromium full-chain project.

## Architecture

Extend `tests/e2e/full-chain/app-shell.spec.ts` with one visual-layout test. Use the existing full-chain mock backend and route through `/` so the page is tall enough to test BackTop. Save screenshots under Playwright `test-results`, which is already ignored by git.

## Acceptance Criteria

- Desktop screenshot is produced.
- Mobile screenshot is produced.
- Desktop and mobile checks pass without horizontal document overflow.
- Header shell controls stay within viewport bounds.
- Mobile BackTop appears after scroll and remains inside the viewport.
