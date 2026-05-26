# Home Statistics Nullish Fallback Parity Design

## Goal

Restore the old React home page behavior for missing or `null` statistics fields.

The old `rankland-fe/src/pages/index.tsx` renders:

```tsx
data?.statistics.totalSrkCount ?? '-'
data?.statistics.totalViewCount ?? '-'
```

The migrated Vue home page currently checks only whether the `statistics` object exists. If the upstream response contains a partial object, `totalSrkCount` or `totalViewCount` can render as the literal strings `undefined` or `null` instead of the legacy `-` fallback.

## Scope

- Add full-chain mock-backend support for a partial statistics response.
- Add home full-chain coverage proving SSR HTML and hydrated DOM both render `-` for missing/null statistics fields.
- Update the Vue home computed statistics text to use nullish field fallback.
- Update migration status and manual acceptance docs when verified.

## Non-Goals

- Do not change the home SSR failure policy for a failed `/statistics` request.
- Do not change normal successful statistics rendering.
- Do not change home layout, Ant Design card styles, route metadata, or generated routes.

## Acceptance Criteria

- `/` renders `-` for `totalSrkCount` when the statistics object exists but the field is missing.
- `/` renders `-` for `totalViewCount` when the statistics object exists but the field is `null`.
- SSR HTML and hydrated DOM agree, avoiding a statistics fallback hydration flicker.
- Existing home full-chain behavior remains green.
- Full migration gate passes: `gen:client-router`, `test:migration`, and `git diff --check`.

## Risks

- The API type still declares numeric fields, but the old React UI tolerated nullish fields. This slice intentionally keeps the tolerance at the presentation boundary rather than broadening the API contract.
