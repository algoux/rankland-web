# Playground Shell DOM Parity Design

## Goal

Restore the old React `/playground` shell DOM/class contract around the playground route and core SRK playground container.

## Source Evidence

Old React `rankland-fe/src/pages/playground/index.tsx` renders the route root as a plain `div`:

```tsx
return (
  <div>
    <Helmet>...</Helmet>
    <div>{isBrowser() ? <SrkPlayground /> : <Loading />}</div>
  </div>
);
```

Old React `rankland-fe/src/components/SrkPlayground.tsx` renders the product playground root as:

```tsx
<div className="srk-playground-container" style={{ height: `${remainingHeight}px` }}>
  <MonacoEditor ... />
  {renderPreview()}
</div>
```

Old `SrkPlayground.less` only attaches layout behavior to that legacy class:

```less
.srk-playground-container {
  display: flex;
  .srk-playground-preview {
    flex: 1;
    overflow-x: auto;
    position: relative;
  }
}
```

Current Vue still renders a Vue-only route class and a Vue-only layout class:

```vue
<main data-id="playground-page" class="playground-page">
...
<section class="playground-layout srk-playground-container" ...>
```

and scoped route chrome:

```less
.playground-page {
  box-sizing: border-box;
  min-height: 70vh;
}
```

## Scope

This slice changes only:

- `src/client/modules/playground/playground.view.vue` outer route tag/class and playground container tag/class/style selectors;
- `tests/e2e/full-chain/playground.spec.ts` shell DOM assertions;
- migration docs that record the restored shell contract.

## Non-Goals

- Do not change Monaco package version, Monaco loader, editor diagnostics, preview parsing, welcome modal behavior, or SRK preview rendering.
- Do not remove stable `data-id` hooks used by full-chain tests.
- Do not remove the editor pane wrapper in this slice; it carries migrated Monaco readiness markers and responsive sizing.
- Do not change the accepted mobile no-horizontal-overflow guard.

## Test Strategy

Use the existing `/playground` full-chain route test.

RED:

- Add a helper that reports `[data-id="playground-page"]` tag/class/min-height and `.srk-playground-container` tag/class/display.
- Assert the route root is a plain `DIV` with no classes and `min-height: 0px`.
- Assert `.playground-layout` is absent.
- Assert the core container is a `DIV` with exact class list `['srk-playground-container']` and `display: flex`.
- Current Vue should fail because it renders `MAIN.playground-page`, computes `70vh`, and includes `.playground-layout`.

GREEN:

- Change route root to `<div data-id="playground-page">`.
- Change the core container to `<div class="srk-playground-container" ...>`.
- Retarget scoped CSS and the mobile media query from `.playground-layout` to `.srk-playground-container`.
- Remove now-unused `.playground-page` CSS.

Full gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- `/playground` route wrapper is a `DIV` with stable `data-id="playground-page"`.
- `/playground` route wrapper does not emit Vue-only `playground-page` class or route-local `70vh` min-height.
- Core playground container is a `DIV.srk-playground-container` without Vue-only `.playground-layout`.
- Existing editor, preview, docs link, invalid JSON, checker error, welcome modal, dark theme, and desktop/mobile bounds coverage remains green.
