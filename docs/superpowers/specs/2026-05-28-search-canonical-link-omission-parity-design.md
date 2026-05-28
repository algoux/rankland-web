# Search Canonical Link Omission Parity Design

## Goal

Restore old React `/search` Head output by omitting the canonical link that the old page did not render.

## Source Evidence

Old React `rankland-fe/src/pages/search/index.tsx` renders only title and Open Graph title inside `Helmet`:

```tsx
<Helmet>
  <title>{formatTitle('探索')}</title>
  <meta property="og:title" content={formatTitle('探索')} />
</Helmet>
```

Current Vue adds an extra canonical link:

```vue
<Head>
  <title>{{ pageTitle }}</title>
  <meta property="og:title" :content="pageTitle">
  <link rel="canonical" :href="canonicalPath">
</Head>
```

`/search` is a CSR database exploration workflow and the migration should preserve the old route-local Head contract rather than adding new canonical output.

## Scope

This slice changes only:

- `tests/e2e/full-chain/search.spec.ts` Head assertion for `/search`;
- `src/client/modules/search/search.view.vue` Head markup and now-unused `canonicalPath` computed property;
- migration docs that record the restored omission.

## Non-Goals

- Do not change title or `og:title`.
- Do not change app-level default Head tags.
- Do not change canonical behavior for Home, Ranklist, Collection, Playground, or Live.
- Do not change search query normalization, Fuse behavior, Ant Design input/list rendering, loading/error states, or existing route wrapper DOM.

## Test Strategy

Use the existing `/search` full-chain route test.

RED:

- Assert `head link[rel="canonical"]` has count `0` on `/search`.
- Current Vue should fail because it renders a route-local canonical link.

GREEN:

- Remove the route-local canonical link from `src/client/modules/search/search.view.vue`.
- Remove the now-unused `canonicalPath` computed property.
- Keep title and `og:title` unchanged.

Full gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- `/search` keeps title `探索 | RankLand`.
- `/search` keeps `og:title` through the existing Head markup.
- `/search` does not render a route-local canonical link.
- Existing search recent-list, result-list, loading, error, whitespace keyword, zero-result, desktop/mobile bounds, and no-external-call coverage remains green.
