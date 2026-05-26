# Search Hydration Marker Visual Parity Design

## Context

The old React search page does not render a visible hydration/debug marker. The Vue search page currently renders:

```vue
<div data-id="search-hydrated" class="search-hydrated">{{ hydrated ? 'hydrated' : 'csr' }}</div>
```

and styles it as a visible 12px muted text block. That exposes migration/test instrumentation in the product UI. The home page already keeps the same kind of test marker visually hidden with a 1px transparent box.

## Goal

Hide the `/search` hydration marker from the visible product UI while preserving the existing `data-id="search-hydrated"` selector and text content for full-chain hydration assertions.

## Scope

- Add a full-chain E2E assertion that the search hydration marker is visually hidden.
- Update `src/client/modules/search/search.view.vue` CSS for `.search-hydrated`.
- Update migration docs after verification.

## Non-Goals

- Do not remove the hydration marker or change the test selector.
- Do not change search data loading, input behavior, or route query behavior.
- Do not change other route markers in this slice.

## Design

Use the existing home marker pattern:

```less
width: 1px;
height: 1px;
overflow: hidden;
color: transparent;
```

This keeps the element mounted and text-readable for Playwright while removing the visible product artifact.

## Test Strategy

Follow TDD:

1. Extend the existing `/search` full-chain smoke test that already checks `search-hydrated` text.
2. Add computed CSS assertions for `width`, `height`, `overflow`, and transparent `color`.
3. Run the focused test and confirm RED fails because the current marker is visible.
4. Apply the minimal CSS change, then run focused search, full search, and the full migration gate.

## Acceptance Criteria

- `[data-id="search-hydrated"]` still has text `hydrated` after CSR mount.
- The marker computes to `width: 1px`, `height: 1px`, `overflow: hidden`, and transparent text color.
- Search full-chain tests pass.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.

## Risks

- `toHaveText` works for visually hidden elements, so this keeps current hydration coverage. Do not switch to `display: none`, because that would make debugging less consistent with the home page marker pattern.
