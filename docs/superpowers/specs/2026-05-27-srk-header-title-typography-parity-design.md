# SRK Header Title Typography Parity Design

## Context

The old React `StyledRanklistRenderer` renders the shared SRK contest title as:

```tsx
<h1 className="text-center mb-1">{resolveText(staticData.contest.title)}</h1>
```

The old app imports Ant Design v4 reset CSS, which gives plain headings `font-weight: 500`, while the browser default `h1` size remains `2em` (`32px` at the app's 16px base). Tailwind `mb-1` then sets the bottom margin to `4px`.

The current Vue wrapper already uses a semantic `h1`, but its scoped style sets the title to `28px` and does not pin the old `500` weight. That leaves a visible lower-level SRK wrapper typography difference across `/ranklist/:id`, `/collection/:id`, `/playground`, and `/live/:id`.

## Decision

Restore the old SRK header title presentation in `src/client/components/rankland-ranklist.vue`:

- keep the existing `h1` DOM and `data-id="rankland-ranklist-title"`;
- set `font-size: 32px`;
- set `font-weight: 500`;
- keep `margin: 0 0 4px`;
- keep inherited theme text color.

## Tests

Extend the `/ranklist/:id` full-chain route test because it renders the shared SRK wrapper through SSR, hydration, API wiring, and the low-level renderer:

- read computed styles from `[data-id="rankland-ranklist-title"]`;
- assert `fontSize: 32px`;
- assert `fontWeight: 500`;
- assert `marginBottom: 4px`;
- keep existing title text and route assertions unchanged.

The focused full-chain test must fail before implementation because the current title font size is `28px`.

## Non-Goals

- Do not change route-level page titles or `<Head>` behavior.
- Do not change Home block headings; those are page-specific and already covered separately.
- Do not alter low-level SRK table cells, progress bar, filters, or modal typography in this slice.

## Acceptance Criteria

- The focused `/ranklist/:id` full-chain test fails before implementation for the expected typography mismatch.
- The focused test passes after implementation.
- The full migration gate passes.
- Migration docs record SRK header title typography parity.
