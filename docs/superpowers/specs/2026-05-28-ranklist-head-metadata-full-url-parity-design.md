# Ranklist Head Metadata Full URL Parity Design

## Goal

Restore the old React `/ranklist/:id` loaded-state Head contract by rendering `og:title`, absolute `og:url`, and absolute canonical URL.

## Source Evidence

Old React `rankland-fe/src/pages/ranklist/[id].tsx` builds the loaded-route URL with the route config:

```tsx
const curFullUrl = getFullUrl(formatUrl('Ranklist', { id }));
```

The loaded state then renders:

```tsx
<Helmet>
  <title>{formatTitle(data!.info.name)}</title>
  <meta property="og:title" content={formatTitle(data!.info.name)} />
  <meta property="og:url" content={curFullUrl} />
  <link rel="canonical" href={curFullUrl} />
</Helmet>
```

Current Vue `src/client/modules/ranklist/ranklist.view.vue` renders title and canonical only:

```vue
<Head>
  <title>{{ pageTitle }}</title>
  <link rel="canonical" :href="canonicalUrl">
</Head>
```

The current `canonicalUrl` is route-relative:

```ts
canonicalUrl(): string {
  return `/ranklist/${encodeURIComponent(this.ranklistId)}`;
},
```

This leaves two product parity gaps:

- missing loaded-state `og:title` and `og:url`;
- canonical URL is relative while old React used the absolute production site origin.

## Scope

This slice changes only:

- `tests/e2e/full-chain/ranklist.spec.ts` loaded-route Head assertions;
- `src/client/modules/ranklist/ranklist.view.vue` loaded-route Head markup and URL helper use;
- migration docs and this slice plan.

## Non-Goals

- Do not change Ranklist data loading, SSR/CSR boundary, NotFound/error/loading Head output, SRK rendering, sharing/export behavior, filters, modals, or route wrapper DOM.
- Do not change `/collection/:id` Head output in this slice.
- Do not generalize all site URL helpers beyond the minimal existing `buildHomeAbsoluteUrl` helper.

## Test Strategy

Use the existing first `/ranklist/:id` full-chain test.

RED:

- Assert loaded `/ranklist/test-key?focus=yes` keeps title `Test Contest 2024 | RankLand`.
- Assert `head meta[property="og:title"]` has content `Test Contest 2024 | RankLand`.
- Assert `head meta[property="og:url"]` has content `https://rl.algoux.org/ranklist/test-key`.
- Assert `head link[rel="canonical"]` has href `https://rl.algoux.org/ranklist/test-key`.

Current Vue should fail because `og:title` / `og:url` are absent and canonical is route-relative.

GREEN:

- Import `ranklandRoutes` and `buildHomeAbsoluteUrl` into `ranklist.view.vue`.
- Render loaded-state `og:title` and `og:url` through the existing `<Head>`.
- Change `canonicalUrl` to use `buildHomeAbsoluteUrl(ranklandRoutes.ranklist.build({ id: this.ranklistId }))`.
- Keep `pageTitle` unchanged.

Full gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- Loaded `/ranklist/:id` renders title, `og:title`, absolute `og:url`, and absolute canonical matching old React.
- The absolute URL uses the same default production origin as old React: `https://rl.algoux.org`.
- Existing Ranklist SSR content, hydration, wrapper DOM, SRK rendering, filters, modals, export/share, NotFound/error/loading behavior, and viewport coverage remain green.
