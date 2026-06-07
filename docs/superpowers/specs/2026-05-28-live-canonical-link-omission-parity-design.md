# Live Canonical Link Omission Parity Design

## Goal

Restore old React `/live/:id` Head output by omitting the canonical link that the old page did not render.

## Source Evidence

Old React `rankland-fe/src/pages/live/[id].tsx` renders title-only `Helmet` blocks for loading and error states:

```tsx
<Helmet>
  <title>{formatTitle('Live')}</title>
</Helmet>
```

The loaded state renders title and Open Graph title only:

```tsx
<Helmet>
  <title>{formatTitle(`Live: ${resolveText(ranklist.contest.title)}`)}</title>
  <meta property="og:title" content={formatTitle(`Live: ${resolveText(ranklist.contest.title)}`)} />
</Helmet>
```

Current Vue adds an extra canonical link:

```vue
<Head>
  <title>{{ pageTitle }}</title>
  <meta property="og:title" :content="pageTitle">
  <link rel="canonical" :href="canonicalUrl">
</Head>
```

`/live/:id` is a CSR realtime workflow. The migration should preserve the old route-local Head contract and avoid adding new canonical output.

## Scope

This slice changes only:

- `tests/e2e/full-chain/live.spec.ts` Head assertion for a loaded `/live/:id` route;
- `src/client/modules/live/live.view.vue` Head markup and now-unused `canonicalUrl` computed property;
- migration docs that record the restored omission.

## Non-Goals

- Do not change title or `og:title`.
- Do not change app-level default Head tags.
- Do not change canonical behavior for Home, Ranklist, Collection, Search, or Playground.
- Do not change Live polling, WebSocket setup, scroll-solution behavior, route wrapper DOM, Toastify rendering, or SRK rendering.

## Test Strategy

Use the existing `/live/:id` full-chain route test.

RED:

- Assert `head link[rel="canonical"]` has count `0` on the loaded Live route.
- Current Vue should fail because it renders a route-local canonical link.

GREEN:

- Remove the route-local canonical link from `src/client/modules/live/live.view.vue`.
- Remove the now-unused `canonicalUrl` computed property.
- Keep title and `og:title` unchanged.

Full gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- `/live/:id` keeps title `Live: <contest title> | RankLand` for the loaded state.
- `/live/:id` keeps `og:title` through the existing Head markup.
- `/live/:id` does not render a route-local canonical link.
- Existing Live polling, WebSocket guard, scroll-solution, route wrapper, Toastify, ranklist rendering, error/loading/not-found, desktop/mobile bounds, and no-external-call coverage remains green.
