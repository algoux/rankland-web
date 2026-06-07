# Home Normal Content Spacing Parity Design

## Context

Old React `rankland-fe/src/pages/index.tsx` renders the home page inside:

- `<main className="normal-content">`;
- `<div className="home-intro">`;
- repeated `<div className="block">` sections;
- `<h1 className="block-title">` section headings.

The old shared layout stylesheet defines:

```less
.normal-content {
  padding: 32px 50px;
  @media screen and (max-width: 768px) {
    padding-left: 20px;
    padding-right: 20px;
  }
}

.home-intro {
  .block {
    @apply mt-10;

    .block-title {
      @apply mb-5;
    }
  }
}
```

The Vue home page currently uses a centered `960px` max-width container, `48px 20px 64px` padding, `36px` section gaps, and `16px` heading bottom margins. That differs from the old React product layout and narrows the home page on desktop.

## Decision

Restore the old home page content spacing contract in the Vue route:

- no desktop `max-width` cap on the route content container;
- desktop content padding `32px 50px`;
- mobile horizontal padding `20px` while preserving top/bottom padding;
- home section margin-top `40px`;
- home section heading margin-bottom `20px`.

Keep all existing Ant Design Vue Card/Row/Col content parity, dark text color parity, SSR statistics, structured metadata, and contact modal behavior unchanged.

## Scope

In scope:

- `/` home page route-level content padding and block spacing;
- focused full-chain computed-style coverage for desktop and mobile;
- migration status and manual acceptance documentation.

Out of scope:

- changing home copy, cards, icons, links, SEO metadata, API behavior, contact modal, or app shell;
- generated router output;
- broad SRK renderer work.

## Acceptance Criteria

- A focused home full-chain test fails before implementation because the Vue home container still has the narrower/newer spacing.
- The focused test passes after implementation.
- The full home full-chain spec passes.
- The full migration gate passes with Node 24 and pnpm 8.
- Migration docs record the restored legacy normal-content/block spacing.
