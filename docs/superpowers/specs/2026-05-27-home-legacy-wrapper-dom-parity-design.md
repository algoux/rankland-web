# Home Legacy Wrapper DOM Parity Design

## Context

The old React home page renders its content as:

- `main.normal-content`
- an inner `div.home-intro`
- content blocks inside that `home-intro` container

The migrated Vue home page already restores the old padding, block spacing, section heading typography, statistics fallback, `strong` count presentation, Ant Design card layout, and dark text/card presentation. It currently exposes only `main.home-page` and places sections directly under that element.

## Decision

Restore the old wrapper DOM shape while preserving the migrated Vue page's existing selectors and styling:

- keep `[data-id="home-content"]` on the `main` element;
- add the legacy `normal-content` class to the `main` element;
- add a child `div[data-id="home-intro"].home-intro`;
- move the existing hero and sections inside that child wrapper.

This keeps public test selectors stable and makes the Vue DOM closer to the React source without reintroducing global stylesheet coupling.

## Non-goals

- Do not replace the existing Vue `home-section` classes with old generic `block` classes in this slice.
- Do not change spacing, card layout, statistics rendering, API behavior, SEO metadata, or hydration behavior.
- Do not touch generated router files.

## Test Strategy

Add a full-chain home assertion that inspects the hydrated DOM:

- `[data-id="home-content"]` is still a `MAIN`;
- its class list includes `normal-content`;
- `[data-id="home-intro"]` is a `DIV.home-intro`;
- `home-intro` is a child of `home-content`;
- the first child inside `home-intro` remains the hero block.

Verify RED before changing production code, then verify GREEN with the same focused full-chain test, the complete home full-chain file, and the full migration gate.

## Acceptance Criteria

- The focused full-chain test fails before implementation for the missing legacy wrapper.
- The focused full-chain test passes after implementation.
- The complete home full-chain file remains green.
- `corepack pnpm test:migration` remains green.
- Migration docs record the restored wrapper DOM contract.

## Risks

The extra wrapper must not introduce layout drift. The wrapper receives no styling in this slice, and existing spacing selectors target descendants, so current visual parity should be preserved.
