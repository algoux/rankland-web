# Ranklist Loaded Wrapper DOM Parity Design

## Goal

Restore the old React `/ranklist/:id` loaded wrapper DOM contract by removing the migrated Vue-only `main` root and `section.ranklist-content` loaded content wrapper.

## Source Evidence

Old React `rankland-fe/src/pages/ranklist/[id].tsx` renders the loaded state as:

```tsx
return (
  <div>
    <Helmet>...</Helmet>
    <div
      className="mt-8 mb-8"
      data-id="ranklist-content"
      data-ranklist-id={id}
      data-row-count={String(data.srk.rows.length)}
    >
      <StyledRanklist ... />
    </div>
  </div>
);
```

The old loaded state has:

- route root tag `DIV`;
- loaded content tag `DIV`;
- loaded content classes exactly from the old utility tokens `mt-8 mb-8`;
- no Vue-only `ranklist-content` class on the product DOM.

Current Vue still renders:

```vue
<main>
  ...
  <section data-id="ranklist-content" class="ranklist-content mt-8 mb-8">
```

The `ranklist-content` class is no longer needed for styling because the route-local `mt-8` and `mb-8` utility selectors own the vertical spacing, and the stable `data-id="ranklist-content"` test hook remains available.

## Scope

This slice changes only:

- `src/client/modules/ranklist/ranklist.view.vue` loaded route wrapper tag/class contract;
- `tests/e2e/full-chain/ranklist.spec.ts` full-chain DOM assertions;
- migration docs that record the restored contract.

## Non-Goals

- Do not change Ranklist SSR data loading, error classification, titles, canonical URLs, hydration marker behavior, or SRK renderer internals.
- Do not remove stable `data-id` hooks.
- Do not change NotFound, generic error, or loading state wrappers in this slice; those already preserve the old state utility class tokens with stable route hooks.

## Test Strategy

Use the existing mock-backed full-chain Ranklist route.

RED:

- Add a helper that inspects `[data-id="ranklist-content"]`, its parent element, tag names, class list, and computed spacing.
- Assert loaded `/ranklist/test-key?focus=yes` has parent/root tag `DIV`, content tag `DIV`, content classes `['mt-8', 'mb-8']`, and computed `32px` top/bottom margins.
- Current Vue should fail because the parent/root is `MAIN`, the content tag is `SECTION`, and the content class list includes Vue-only `ranklist-content`.

GREEN:

- Change the route root from `<main>` to `<div>`.
- Change the loaded wrapper from `<section>` to `<div>`.
- Remove the Vue-only `ranklist-content` class from the loaded wrapper while keeping `mt-8 mb-8`.
- Re-run the focused Ranklist full-chain test.

Full gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- Loaded `/ranklist/:id` root wrapper is a `DIV`.
- `[data-id="ranklist-content"]` is a `DIV`.
- `[data-id="ranklist-content"]` class list is exactly `['mt-8', 'mb-8']`.
- `[data-id="ranklist-content"]` still computes `margin-top: 32px` and `margin-bottom: 32px`.
- Existing Ranklist SSR/hydration/SRK full-chain coverage remains green.
