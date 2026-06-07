# Playground Client Wrapper DOM Parity Design

## Goal

Restore the old React `/playground` route-level client wrapper DOM that hosted the dynamically loaded `SrkPlayground` component.

## Source Evidence

Old React `rankland-fe/src/pages/playground/index.tsx` renders:

```tsx
return (
  <div>
    <Helmet>
      <title>{formatTitle('Playground')}</title>
      <meta property="og:title" content={formatTitle('Playground')} />
    </Helmet>
    <div>{isBrowser() ? <SrkPlayground /> : <Loading />}</div>
  </div>
);
```

After the route root, the old product DOM has a plain no-class `div` that hosts the browser-only playground component. Inside that wrapper, `SrkPlayground` renders:

```tsx
<div className="srk-playground-container" style={{ height: `${remainingHeight}px` }}>
```

Current Vue has already restored the route root and exact `DIV.srk-playground-container`, but the container is still a direct child of `[data-id="playground-page"]` after the hidden hydration marker:

```vue
<div data-id="playground-page">
  <div data-id="playground-hydrated" class="playground-hydrated">...</div>
  <div class="srk-playground-container" ...>
```

## Scope

This slice changes only:

- `tests/e2e/full-chain/playground.spec.ts` route child DOM assertions;
- `src/client/modules/playground/playground.view.vue` template wrapper around the existing playground component content;
- migration docs that record the restored route-level wrapper.

## Non-Goals

- Do not change Monaco loading, package version, diagnostics, editor options, or the E2E-only preview hook.
- Do not change SRK preview rendering, welcome modal behavior, invalid JSON behavior, or mobile no-overflow policy.
- Do not add a product class or `data-id` to the restored no-class wrapper.
- Do not move the hidden hydration marker into the legacy wrapper; it remains a hidden migration probe.

## Test Strategy

Use the existing `/playground` full-chain route test.

RED:

- Extend `getPlaygroundShellChrome()` to report `[data-id="playground-page"]` element children.
- Assert child 0 is the hidden hydration marker.
- Assert child 1 is a plain `DIV` with no class and no `data-id`.
- Assert child 1's first element child is the old `DIV.srk-playground-container`.
- Current Vue should fail because child 1 is currently `.srk-playground-container` directly.

GREEN:

- Wrap the existing `.srk-playground-container` in a plain no-class `div`.
- Keep `.srk-playground-container` unchanged inside that wrapper.
- Keep `<a-modal>` outside the wrapper, matching the old modal portal behavior and preserving Ant Design Vue teleport semantics.

Full gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- `/playground` root remains a plain `DIV` with no Vue-only route class.
- The hidden hydration marker remains visually hidden and direct under the route root.
- The first product wrapper after the hydration marker is a plain no-class `DIV`.
- `DIV.srk-playground-container` is a direct child of that wrapper.
- Existing Playground editor, preview, docs link, invalid JSON, checker error, welcome modal, dark theme, and desktop/mobile bounds coverage remains green.
