# Legacy Query Serialization Parity Design

## Context

Old React routes build public URLs through `formatUrl()`, which delegates to `urlcat`. For query strings, `urlcat` keeps empty string values and serializes spaces as `+`.

The Vue migration currently uses a hand-written `buildQuery()` helper in `src/common/rankland-router/routes.ts`. It filters out empty strings and serializes query values with `encodeURIComponent`, producing `%20` for spaces. That diverges from old React public URL behavior for search submissions and any shared route builders that include query parameters.

## Goal

Restore old React query serialization semantics in the shared RankLand route builders:

- omit `undefined` query values;
- preserve empty string query values as `key=`;
- serialize query spaces as `+`;
- keep path parameter encoding unchanged with `encodeURIComponent`.

## Approach

Replace the hand-written query string serialization with `URLSearchParams` while still filtering only `undefined` values. `URLSearchParams` matches the old `urlcat` query behavior for empty values and spaces, and it preserves insertion order for the current route builders.

Update Search submission so an explicitly empty search value is passed to the route builder instead of being converted to `undefined`. This preserves the old React behavior where pressing search on an empty input navigates to `/search?kw=`.

Do not change route definitions, SSR/CSR metadata, generated router outputs, API service URLs, or path parameter encoding.

## Testing

Update `tests/unit/rankland-routes.spec.ts` to assert legacy query serialization across Search, Collection, and Live route builders:

- `ranklandRoutes.search.build({ kw: '' }) === '/search?kw='`;
- query values with spaces serialize as `+`;
- omitted values still omit the query string.

Extend Search full-chain coverage to verify:

- submitting whitespace keeps the old `+` query encoding;
- clearing/submitting an empty search navigates to `/search?kw=` while rendering the recent-list state.

Run a focused RED before implementation, then run the full migration gate after implementation and docs updates.

## Acceptance Criteria

- Public route builders match old React/urlcat query serialization for empty strings and spaces.
- Search empty submissions preserve `/search?kw=` instead of collapsing to `/search`.
- Existing route behavior, SSR/CSR flags, and path encoding remain intact.
- Full migration gate passes.
