# Playground Canonical Link Omission Parity Design

## Goal

Restore old React `/playground` Head output by omitting the canonical link that the old page did not render.

## Source Evidence

Old React `rankland-fe/src/pages/playground/index.tsx` renders only title and Open Graph title inside `Helmet`:

```tsx
<Helmet>
  <title>{formatTitle('Playground')}</title>
  <meta property="og:title" content={formatTitle('Playground')} />
</Helmet>
```

Current Vue adds an extra canonical link:

```vue
<Head>
  <title>{{ pageTitle }}</title>
  <meta property="og:title" :content="pageTitle">
  <link rel="canonical" href="/playground">
</Head>
```

Because `/playground` is a CSR browser-only workflow rather than an SEO-sensitive SSR content route, the migration should preserve the old page-level Head contract and avoid introducing the extra canonical output.

## Scope

This slice changes only:

- `tests/e2e/full-chain/playground.spec.ts` Head assertion for `/playground`;
- `src/client/modules/playground/playground.view.vue` Head markup;
- migration docs that record the restored omission.

## Non-Goals

- Do not change title or `og:title`.
- Do not change app-level default Head tags.
- Do not change canonical behavior for Home, Ranklist, Collection, Search, or Live.
- Do not change Playground DOM, Monaco loading, welcome modal, docs link, SRK preview, or mobile behavior.

## Test Strategy

Use the existing `/playground` full-chain route test.

RED:

- Assert `head link[rel="canonical"]` has count `0` on `/playground`.
- Current Vue should fail because it renders `<link rel="canonical" href="/playground">`.

GREEN:

- Remove the route-local canonical link from `src/client/modules/playground/playground.view.vue`.
- Keep title and `og:title` unchanged.

Full gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- `/playground` keeps title `Playground | RankLand`.
- `/playground` keeps `og:title` through the existing Head markup.
- `/playground` does not render a route-local canonical link.
- Existing Playground editor, preview, docs link, invalid JSON, checker error, welcome modal, dark theme, and desktop/mobile bounds coverage remains green.
