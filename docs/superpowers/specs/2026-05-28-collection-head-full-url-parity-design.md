# Collection Head Full URL Parity Design

## Goal

Restore the old React `/collection/:id` loaded-state Head URL contract by rendering absolute `og:url` and canonical URLs.

## Source Evidence

Old React `rankland-fe/src/pages/collection/[id].tsx` builds the loaded-route URL with the route config:

```tsx
const curFullUrl = getFullUrl(formatUrl('Collection', { id, rankId: rankId || undefined }));
```

The loaded state then renders:

```tsx
<Helmet>
  <title>{title}</title>
  <meta property="og:title" content={title} />
  <meta property="og:url" content={curFullUrl} />
  <link rel="canonical" href={curFullUrl} />
</Helmet>
```

Current Vue `src/client/modules/collection/collection.view.vue` renders the same tags, but `canonicalUrl` is route-relative:

```ts
canonicalUrl(): string {
  return ranklandRoutes.collection.build({
    id: this.id,
    rankId: this.rankId && !this.ranklistIdInvalid ? this.rankId : undefined,
  });
},
```

For a selected ranklist route, old React produces `https://rl.algoux.org/collection/official?rankId=test-key`, while current Vue produces `/collection/official?rankId=test-key`.

## Scope

This slice changes only:

- `tests/e2e/full-chain/collection.spec.ts` loaded-route Head URL assertions;
- `src/client/modules/collection/collection.view.vue` URL helper use;
- migration docs and this slice plan.

## Non-Goals

- Do not change Collection title logic, route query handling, selected-ranklist cleanup, collection menu layout, remaining-height behavior, collapse behavior, SRK rendering, or error/loading states.
- Do not change Ranklist, Home, Search, Playground, or Live Head behavior.
- Do not introduce a broader site URL helper refactor in this slice.

## Test Strategy

Use the existing first `/collection/:id` full-chain test.

RED:

- Assert loaded `/collection/official?rankId=test-key` keeps title `Test Contest 2024 - 榜单合集 | RankLand`.
- Assert `head meta[property="og:title"]` has content `Test Contest 2024 - 榜单合集 | RankLand`.
- Assert `head meta[property="og:url"]` has content `https://rl.algoux.org/collection/official?rankId=test-key`.
- Assert `head link[rel="canonical"]` has href `https://rl.algoux.org/collection/official?rankId=test-key`.

Current Vue should fail because `og:url` and canonical are route-relative.

GREEN:

- Import `buildHomeAbsoluteUrl` into `collection.view.vue`.
- Wrap the existing `ranklandRoutes.collection.build(...)` output with `buildHomeAbsoluteUrl(...)`.
- Keep `pageTitle` and all loaded/error/loading rendering unchanged.

Full gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- Loaded `/collection/:id?rankId=:rankId` renders title, `og:title`, absolute `og:url`, and absolute canonical matching old React.
- The absolute URL uses the same default production origin as old React: `https://rl.algoux.org`.
- Existing Collection SSR content, hydration, selected-ranklist rendering, invalid `rankId` cleanup, menu layout, mobile behavior, and viewport coverage remain green.
