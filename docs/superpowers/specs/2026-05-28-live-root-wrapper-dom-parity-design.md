# Live Root Wrapper DOM Parity Design

## Goal

Restore the old React `/live/:id` loaded page root DOM contract by removing the migrated Vue-only `main.live-page` wrapper and route-local `min-height: 70vh`.

## Source Evidence

Old React `rankland-fe/src/pages/live/[id].tsx` renders loaded live content as:

```tsx
return (
  <div>
    <Helmet>...</Helmet>
    <div
      className="mt-8 mb-8"
      style={{ marginLeft: enabledScrollSolution ? '250px' : undefined }}
      data-id="live-ranklist-content"
      data-ranklist-id={key}
      data-row-count={String(ranklist.rows.length)}
    >
      ...
    </div>
  </div>
);
```

The old loaded state has:

- root tag `DIV`;
- no route-level `live-page` class;
- no route-local `min-height: 70vh`;
- loaded content keeps the already restored `mt-8 mb-8` classes and `250px` scroll-solution offset.

Current Vue still renders:

```vue
<main data-id="live-page" class="live-page">
```

and scoped CSS:

```less
.live-page {
  min-height: 70vh;
}
```

## Scope

This slice changes only:

- `src/client/modules/live/live.view.vue` root wrapper tag/class and now-unused `.live-page` CSS;
- `tests/e2e/full-chain/live.spec.ts` wrapper chrome assertions;
- migration docs that record the restored contract.

## Non-Goals

- Do not change Live data loading, polling, WebSocket reconnect, Toastify behavior, SRK rendering, query handling, or mobile scroll-solution behavior.
- Do not remove stable test hooks; keep `data-id="live-page"` for migration coverage.
- Do not redesign Live page layout.

## Test Strategy

Use the existing full-chain Live route with mock backend and stubbed WebSocket.

RED:

- Extend `getLiveWrapperChrome()` to report `pageTagName`, `pageClasses`, and `pageMinHeight`.
- Assert loaded `/live/live-test-key?token=t0&scrollSolution=1&focus=yes` has root `DIV`, no `live-page` class, and computed `min-height: 0px`.
- Current Vue should fail because it returns `MAIN`, includes `live-page`, and computes a non-zero `70vh` min-height.

GREEN:

- Change the root wrapper to `<div data-id="live-page">`.
- Remove `.live-page { min-height: 70vh; }`.
- Re-run the focused Live full-chain test.

Full gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- Loaded `/live/:id` root wrapper is a `DIV` with stable `data-id="live-page"`.
- Loaded `/live/:id` root wrapper does not emit Vue-only `live-page` class.
- Loaded `/live/:id` root wrapper has no route-local `70vh` min-height.
- Existing Live route content spacing, scroll-solution offset, and mobile no-toggle-DOM behavior remain covered by current tests.
