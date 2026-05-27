# Search Row Content DOM Parity Design

## Context

The old React `/search` page renders each ranklist row with legacy utility class tokens on the row content nodes:

```tsx
<List.Item data-id="search-ranklist-item" data-ranklist-key={item.uniqueKey}>
  <p className="mb-0">
    <Link ...>{item.name}</Link>
    <span className="ml-2 opacity-70">
      <EyeOutlined /> {item.viewCnt}
    </span>
  </p>
  <p className="mb-0 opacity-50 text-sm">创建于 ...</p>
</List.Item>
```

The Vue migration currently preserves those old utility tokens but also emits Vue-only row content classes: `.search-row-title`, `.search-view-count`, and `.search-created-at`. The previous search content slice restored the section titles, list wrappers, and empty-state wrapper; this slice completes the next nested row-content DOM contract.

## Decision

Restore the old row content class contract for both search results and recent ranklists:

- row title paragraph: `class="mb-0"`;
- view count span: `class="ml-2 opacity-70"`;
- created-at paragraph: `class="mb-0 opacity-50 text-sm"`;
- no `.search-row-title`, `.search-view-count`, or `.search-created-at` classes on those row content nodes.

Keep the current `a-list-item.search-list-item` root for this slice. The old React `List.Item` root did not set a custom class, but the Vue migration uses this root class for block layout. Removing it should be handled in a separate slice only after proving the Ant Design Vue item display matches the old Ant Design React layout.

## Styling

Move the row presentation currently attached to Vue-only classes onto scoped legacy utility tokens:

- `.mb-0` keeps row paragraphs at zero top and bottom margin to preserve the verified row typography and prevent browser default `<p>` margins from reappearing.
- `.ml-2` preserves the 8px view-count spacing.
- `.opacity-70`, `.opacity-50`, and `.text-sm` preserve opacity and 14px metadata text.

## Test Strategy

Update `tests/e2e/full-chain/search.spec.ts` before implementation:

- result rows use direct legacy selectors under `[data-id="search-ranklist-item"]`;
- recent rows use the same direct legacy selectors;
- the old row content selectors remain visible and keep computed opacity/margin/font-size;
- Vue-only row content classes have count `0`.

The focused RED command should fail before implementation because current Vue still renders `.search-row-title`, `.search-view-count`, and `.search-created-at`.

## Acceptance Criteria

- `/search?kw=Test%202024` result row content matches the old React class-token contract.
- `/search` recent row content matches the old React class-token contract.
- Existing search result count, links, Eye icon, and spacing/color assertions still pass.
- Full migration gate passes after route regeneration.

## Risks

- Scoped utility classes on a Vue component can diverge from the old global utility implementation. The slice keeps the existing computed style assertions so any accidental visual change is caught.
- Root `List.Item` class parity is intentionally deferred; this avoids mixing row-content DOM parity with Ant Design Vue list layout risk.
