# Not Found Action Button Parity Design

## Context

The old React route Not Found states use Ant Design primary small buttons for the return-home action:

- `/ranklist/:id`: `<Link><Button type="primary" size="small">Back to Home</Button></Link>`.
- `/collection/:id`: `<Link><Button type="primary" size="small">Back to Home</Button></Link>`.
- `/live/:id`: `<Link><Button type="primary" size="small">Back to Home</Button></Link>`.

The Vue migration currently renders plain `<router-link>` text for those same `data-id` links. That preserves navigation but not the old product UI.

## Goal

Restore Ant Design Vue primary small return-home buttons on ranklist, collection, and live Not Found states while preserving existing route/link selectors.

## Scope

- Keep the stable link selectors:
  - `data-id="ranklist-not-found-home-link"`;
  - `data-id="collection-not-found-home-link"`;
  - `data-id="live-not-found-home-link"`.
- Render an Ant Design Vue button inside each router link with `type="primary"` and `size="small"`.
- Restore old heading level to `h3` for these Not Found states.
- Do not change API error mapping, route titles, Not Found HTTP behavior, or generic error/loading states in this slice.

## Tests

- Extend existing full-chain Not Found tests for ranklist, collection, and live to assert the return-home link contains `.ant-btn-primary.ant-btn-sm`.
- Assert the Not Found heading is an `h3` with the legacy text.
- Run focused ranklist/live/collection full-chain specs before implementation and confirm they fail against the current plain links.

## Acceptance

- Focused ranklist/live/collection full-chain specs fail before implementation and pass after implementation.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before the slice is reported as verified.
- `docs/migration/status.md` records Not Found Ant Design action parity and the updated full-gate evidence.
