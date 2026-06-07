# Home Search Visual Review Design

## Context

The global app shell now has desktop/mobile screenshot review. The migration final gate still requires page-level Playwright visual review for key public routes. `/` and `/search` are the highest-traffic entry points and cover both SSR and CSR behavior.

## Goal

Add focused visual/layout review for the home and search routes.

## Scope

- Capture desktop and mobile screenshots for `/`.
- Capture desktop and mobile screenshots for `/search?kw=Test%202024`.
- Assert no horizontal document overflow.
- Assert key page sections and controls stay inside viewport bounds.
- Assert hydrated route content is visible before screenshots.

## Non-Goals

- Pixel snapshot comparison.
- Full visual review for ranklist, collection, playground, or live routes.
- Exact Ant Design card styling.
- Redesigning home or search UI.

## Architecture

Add layout helper functions directly to the relevant full-chain specs to keep the slice local. Use Playwright screenshots saved under ignored `test-results`.

The home route verifies:

- hero and recommendation grid are visible;
- desktop and mobile page width does not overflow;
- recommendation cards fit mobile viewport.

The search route verifies:

- result mode for a keyword query is visible;
- search form controls fit desktop and mobile viewport;
- result list fits mobile viewport.

## Acceptance Criteria

- Home desktop/mobile screenshots are produced.
- Search desktop/mobile screenshots are produced.
- No horizontal overflow is detected on tested viewports.
- Key route controls remain within viewport bounds.
- Existing home/search behavioral assertions still pass.
