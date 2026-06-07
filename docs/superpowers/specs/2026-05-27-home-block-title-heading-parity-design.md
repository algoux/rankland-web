# Home Block Title Heading Parity Design

## Context

Old React `rankland-fe/src/pages/index.tsx` renders home sections as repeated blocks:

```tsx
<div className="block">
  <h1 className="block-title">为你推荐</h1>
  ...
</div>
```

The old layout stylesheet only adds the Tailwind `mb-5` spacing to `.block-title`; the heading element itself remains an `h1`, using the legacy Ant/global heading reset plus browser h1 sizing. This makes home section headings visually larger than card titles.

The Vue home page currently renders section headings as plain `h2` elements and route-scoped CSS forces them to `22px`, which is closer to compact panel headings than the old React home page block titles.

## Decision

Restore home section title parity:

- render each home section title as `h1 class="block-title"`;
- keep the text and section order unchanged;
- style `.home-section .block-title` with the old h1-level visual contract:
  - `margin: 0 0 20px`;
  - `font-size: 32px`;
  - `font-weight: 500`;
  - inherited legacy text color;
- keep card titles as `h2.home-card-title`.

This narrows the change to home section headings without touching SSR data, cards, links, contact modal, or app shell behavior.

## Scope

In scope:

- `/` home section heading DOM level and typography;
- focused full-chain coverage for the recommendations section heading;
- migration status and acceptance documentation.

Out of scope:

- changing the hero title, card title structure, SEO metadata, statistics loading, or shared app shell;
- generated router output;
- SRK renderer work.

## Acceptance Criteria

- The focused home full-chain test fails before implementation because the recommendations section title is an `h2` without `block-title` and uses `22px`.
- The focused test passes after implementation.
- The full home full-chain spec passes.
- The full migration gate passes with Node 24 and pnpm 8.
- Migration docs record restored `h1.block-title` parity.
