# Search Shell DOM Parity Design

## Goal

Restore the old React `/search` route shell DOM where it is publicly observable and currently Vue-only.

## Source Behavior

`rankland-fe/src/pages/search/index.tsx` returns:

```tsx
<div className="normal-content">
  <Helmet>...</Helmet>
  <div>
    <h3 className="mb-6">在榜单数据库中探索</h3>
    <Input.Search ... />
    ...
  </div>
</div>
```

The old route shell has a `div.normal-content` root and a plain inner `div`. It does not emit a semantic `main`, a `section.search-panel`, a `.search-page` class, or route-local `min-height` styling.

## Current Gap

The migrated Vue page currently renders:

```vue
<main data-id="search-page" class="search-page normal-content">
  <section class="search-panel">
    ...
  </section>
</main>
```

That adds Vue-only shell tags/classes and a route-local `min-height: 70vh`. Existing tests cover the visible search behavior, Ant Design controls, list rows, state spacing, and viewport bounds, but they do not lock the old shell tag/class contract.

## Target Behavior

- Render the route root as `div.normal-content` while preserving `data-id="search-page"`.
- Render the content wrapper as a plain `div` without the Vue-only `.search-panel` class.
- Remove the Vue-only `.search-page` class and the route-local `min-height` rule.
- Preserve all current product behavior: title/meta/canonical, hydration marker, search input, loading/error/recent/result states, list rows, route pushes, and viewport bounds.

## Non-goals

- Do not change Fuse search semantics, request flow, route query normalization, or Ant Design Vue component choices.
- Do not change list row DOM beyond the shell ancestry.
- Do not broaden this into visual redesign or subjective pixel parity.

## Test Strategy

Update the existing `/search` full-chain recent-list test because it already proves the CSR page, API request path, Ant Design search input, and recent rows. Add DOM assertions that:

- `[data-id="search-page"]` has tag name `DIV`.
- `[data-id="search-page"]` does not carry the Vue-only `.search-page` class.
- The first visible content wrapper under `[data-id="search-page"]` is a plain `DIV`.
- No `.search-panel` wrapper is rendered.
- The route root does not carry the Vue-only `min-height: 70vh` rule.

Focused RED should fail on the current Vue implementation because the root is `MAIN`, has `.search-page`, the inner wrapper is `SECTION.search-panel`, and min-height is `70vh`.

## Acceptance Criteria

- Focused `/search` full-chain RED reproduces the shell DOM mismatch.
- Focused `/search` full-chain GREEN passes after the minimal Vue template/CSS change.
- Existing `/search` behavior and viewport checks continue to pass.
- Full migration gate passes.
