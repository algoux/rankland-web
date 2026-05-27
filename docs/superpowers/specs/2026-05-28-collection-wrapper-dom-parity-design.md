# Collection Wrapper DOM Parity Design

## Context

The old React collection route renders the selected collection page with plain `div` wrappers and legacy class tokens:

- Page root: `<div>`.
- Loaded shell: `<div className="srk-collection-container">`.
- Fixed navigation: `<div className="srk-collection-nav">`.
- Hidden header: `<div className="srk-collection-hidden-header">`.
- Ranklist panel: `<div className="srk-collection-ranklist">`.
- Selected ranklist content: `<div className="pb-8" data-id="collection-ranklist-content" ...>`.

The migrated Vue route already preserves the collection behavior, data attributes, nav animation, mobile collapse, Ant Design Vue menu, and selected-ranklist rendering. It still exposes migration-era wrapper DOM in the loaded path: a `main` root, `section` shell/panel nodes, and Vue-only product classes such as `collection-page`, `collection-hidden-header`, `collection-ranklist-panel`, and `collection-ranklist-content`.

## Goal

Restore the old React collection loaded wrapper DOM and exact legacy class contract without changing route data loading, SSR/hydration behavior, menu behavior, collapse behavior, or SRK renderer output.

## Scope

- Change the collection route root from `main` to `div`.
- Change the loaded collection shell from `section` to `div`.
- Keep `data-id="collection-content"` and assert the element is a `DIV`.
- Keep the old shell class `srk-collection-container`, but remove Vue-only product classes from the loaded shell class list.
- Remove dynamic Vue-only state classes from the shell DOM; continue deriving collapsed/mobile behavior from reactive state and inline styles.
- Change the nav wrapper from `aside` to `div`.
- Keep `data-id="collection-nav"` and assert exact old class list `srk-collection-nav`.
- Change the ranklist panel from `section` to `div`.
- Keep `data-id="collection-ranklist-panel"` and assert exact old class list `srk-collection-ranklist`.
- Change hidden header markup to expose only `srk-collection-hidden-header`.
- Retarget scoped CSS selectors from Vue-only class names to legacy classes and inline style attributes.
- Change selected ranklist content to expose exact old class list `pb-8` while preserving the existing `data-id`, `data-ranklist-id`, `data-row-count`, and 32px bottom padding.

## Non-Goals

- Do not change collection async data, upstream API calls, invalid `rankId` cleanup, menu item generation, or selected ranklist fetch behavior.
- Do not change nav width, remaining-height calculation, transition timing, mobile collapse behavior, hidden-header sizing, or panel visibility.
- Do not change shared `RanklandRanklist` / SRK renderer internals.
- Do not hand-edit generated router outputs.

## Test Strategy

Use `tests/e2e/full-chain/collection.spec.ts` because these are public route DOM contracts that depend on SSR, hydration, and mock-backed RankLand API data.

Focused RED:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders selected ranklist"
```

Expected initial failure: the route still renders `MAIN`, `SECTION`, and Vue-only classes instead of the old React `DIV` wrappers and exact legacy class lists.

Focused GREEN: the same command passes after the template and route-local CSS selector changes.

Full gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- The loaded collection route root is a `DIV`.
- `[data-id="collection-content"]` is a `DIV` with exact class list `srk-collection-container`.
- `[data-id="collection-nav"]` is a `DIV` with exact class list `srk-collection-nav`.
- `.srk-collection-hidden-header` is a `DIV` with exact class list `srk-collection-hidden-header`.
- `[data-id="collection-ranklist-panel"]` is a `DIV` with exact class list `srk-collection-ranklist`.
- `[data-id="collection-ranklist-content"]` is a `DIV` with exact class list `pb-8`.
- Existing selected-ranklist SSR/hydration, menu, collapse, remaining-height, viewport, and SRK renderer tests remain green.
- Migration status, manual checklist, and final integration review record the verified slice and gate evidence.
