# Search List Utility Class Parity Design

## Context

Old React `/search` rendered search and recent rows with legacy utility class tokens:

- result/recent section wrapper: `mt-10`
- section title: `opacity-70`
- list wrapper: `mt-2`
- row title paragraph: `mb-0`
- view-count span: `ml-2 opacity-70`
- created-at paragraph: `mb-0 opacity-50 text-sm`

The Vue search page already restores the visual spacing and typography with scoped classes, but the old class-token contract is missing from the DOM. Other migration slices have restored similar legacy class tokens where they are part of the old public product surface and useful for visual parity auditing.

## Requirement

Restore the old search list utility class tokens while preserving the current Ant Design Vue `a-list` rendering, stable `data-id` selectors, and existing computed visual styles.

## Scope

- Apply to both search-result rows and recent-ranklist rows.
- Keep the current `search-*` classes so existing tests and scoped CSS remain stable.
- Do not reintroduce the old extra wrapper `div` around `List`; class-token parity on the `a-list` element is enough because computed spacing already matches.
- Do not change search data loading, Fuse behavior, routing, or API calls.

## Acceptance

- `/search?kw=Test%202024` exposes the old utility tokens on the result section, title, list, row title, view-count span, and created-at row.
- `/search` exposes the same old utility tokens on the recent section/list rows.
- Existing computed spacing, opacity, font-size, link, and Ant Design List assertions remain passing.
