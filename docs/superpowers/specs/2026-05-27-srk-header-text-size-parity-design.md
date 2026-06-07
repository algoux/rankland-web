# SRK Header Text Size Parity Design

## Context

The old React `StyledRanklistRenderer` renders shared SRK header metadata inside plain Ant Design/Tailwind elements:

- header meta block: `<div className="text-center mt-1">`;
- view count span: `<span className="mr-2">`;
- contributors paragraph: `<p className="mb-0">`;
- contest ref links: a plain `<span>`;
- time paragraph: `<p className="text-center mb-0">`.

None of those elements set a custom text size, so they inherit the old Ant Design v4 body size of `14px`.

The current Vue wrapper sets `font-size: 13px` on `.rankland-ranklist-header-meta`, `.rankland-ranklist-contributors`, `.rankland-ranklist-ref-links`, and `.rankland-ranklist-time`. That leaves the shared SRK header visibly smaller than the old React product surface.

## Decision

Restore old React inherited text size for the non-title SRK header text:

- `.rankland-ranklist-header-meta` and header actions inherit/use `14px`;
- `.rankland-ranklist-contributors` uses `14px`;
- `.rankland-ranklist-ref-links` uses `14px`;
- `.rankland-ranklist-time` uses `14px`;
- keep existing colors, margins, links, dropdowns, and action separator behavior unchanged.

## Tests

Extend the `/ranklist/:id` full-chain route test because it renders the shared SRK wrapper through SSR, hydration, API wiring, and mock backend data:

- read computed font sizes from the header meta block;
- assert view count, contributors, reference links, and time are `14px`;
- keep the existing title, color, spacing, and action assertions unchanged.

The focused full-chain test must fail before implementation because current Vue styles return `13px` for these header text nodes.

## Non-Goals

- Do not change the SRK header title; it is covered by the previous title typography slice.
- Do not change row/table cell typography in the low-level SRK renderer.
- Do not change route-level heading typography outside the shared SRK wrapper.

## Acceptance Criteria

- The focused `/ranklist/:id` full-chain test fails before implementation for the expected `13px`/`14px` mismatch.
- The focused test passes after implementation.
- The full migration gate passes.
- Migration docs record SRK header text-size parity.
