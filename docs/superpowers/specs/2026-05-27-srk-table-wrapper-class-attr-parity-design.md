# SRK Table Wrapper Class Attribute Parity Design

## Context

The old React `StyledRanklistRenderer` renders the low-level SRK table wrapper as:

```tsx
<div className={tableClass} style={tableStyle}>
```

Route callers pass `tableClass="ml-4"` for `/ranklist/:id` and `/live/:id`. Collection and Playground do not pass `tableClass`, so the old DOM has no extra table-wrapper class token there.

The Vue migration currently keeps the stable `data-id="rankland-ranklist-table-wrapper"` hook but also adds a Vue-only `rankland-ranklist-table-wrapper` class to every route. Earlier slices already moved table spacing to the old `div.mt-6` spacer and use the `data-id` hook for tests, so this class is no longer needed for layout.

## Decision

Restore old class-attribute behavior while preserving the test hook:

- Keep `data-id="rankland-ranklist-table-wrapper"`.
- Bind the wrapper class only to `tableClass`.
- Render `class="ml-4"` for ranklist detail and live routes.
- Render no class attribute when `tableClass` is not provided, matching collection and playground old React behavior.
- Do not change table spacing, remarks placement, SRK renderer props, filters, progress, footer, modal behavior, or data flow.

## Test Strategy

Use full-chain Playwright route coverage because the parity is public DOM:

- `/ranklist/:id`: assert wrapper `class` is exactly `ml-4` and margin-left remains `16px`.
- `/live/:id`: assert wrapper `class` is exactly `ml-4` and margin-left remains `16px`.
- `/collection/:id`: assert wrapper `class` attribute is absent and margin-left remains `0px`.
- `/playground`: assert wrapper `class` attribute is absent while the valid preview wrapper stays `div.mt-8.mb-8`.

Run focused specs first to verify RED/GREEN, then run the migration gate.

## Acceptance Criteria

- Shared `RanklandRanklist` no longer emits the Vue-only table wrapper class.
- Existing `data-id` selectors keep tests and future audits stable.
- Route-level visual spacing remains unchanged.
- Migration status, manual acceptance checklist, and final integration review record this slice.
