# Search State Utility Class Parity Design

## Context

Old React `/search` rendered loading and initialization error states with utility class tokens:

- loading: `<Spin className="mt-10" />`
- error wrapper: `<div className="mt-10">`
- error text: `<div className="text-red-500">初始化榜单数据库失败，请刷新再试。</div>`

The Vue search page already matches the computed 40px top spacing and red color through `search-state` / `search-error`, but the old class-token contract is missing from the product DOM.

## Requirement

Restore the legacy loading/error utility class tokens while preserving current `data-id` selectors, Ant Design Vue spinner rendering, error copy, and computed styles.

## Scope

- Add `mt-10` to the loading spinner and error state node.
- Add `text-red-500` to the error state node. The old React page used a child node, but the Vue page has a single stable `data-id="search-error"` node; applying the old text class to that node keeps the public class contract without adding wrapper DOM.
- Do not change API loading, error mapping, search routing, or list rendering.

## Acceptance

- `/search` while `listAllRanklists` is delayed renders `[data-id="search-loading"]` with `mt-10`.
- `/search` when `listAllRanklists` fails renders `[data-id="search-error"]` with `mt-10 text-red-500`.
- Existing computed margin-top and color assertions continue passing.
