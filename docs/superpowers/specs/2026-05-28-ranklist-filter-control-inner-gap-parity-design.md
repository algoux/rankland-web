# Ranklist Filter Control Inner Gap Parity Design

## Context

The old React `StyledRanklistRenderer` renders the SRK filter controls as inline children:

```tsx
<div>
  <span>筛选</span>
  <Select className="ml-2" style={{ width: '160px' }} />
  <span className="ml-5 inline-flex items-center">
    <span className="mr-1">仅正式参赛</span>
    <Switch size="small" />
  </span>
  <Radio.Group className="ml-5 inline-flex items-center" />
</div>
```

The migrated Vue wrapper keeps the old utility classes but also adds wrapper-level flex gaps:

```less
:global(.rankland-ranklist-filter) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

:global(.rankland-ranklist-checkbox) {
  margin-left: 20px;
  gap: 4px;
}
```

That makes visual spacing larger than old React:

- organization label-to-Select spacing comes from wrapper `gap: 8px`; after removing that Vue-only gap, the migrated component needs a local `.ml-2` utility rule to provide the old 8px margin because there is no global Tailwind utility sheet;
- official text-to-Switch spacing comes from wrapper `gap: 4px`; after removing that Vue-only gap, the migrated component needs a local `.mr-1` utility rule to provide the old 4px margin because there is no global Tailwind utility sheet.

The old spacing source should be the utility classes themselves, not Vue-only wrapper gaps.

## Goal

Restore the old React SRK filter-control inner visual spacing while preserving the current Ant Design Vue controls, stable test hooks, and filtering behavior.

## Scope

- Assert the actual rendered distance from the `筛选` text to the organization Select.
- Assert the actual rendered distance from the `仅正式参赛` text to the Switch.
- Remove Vue-only wrapper gap from `.rankland-ranklist-filter`.
- Remove Vue-only wrapper gap from `.rankland-ranklist-checkbox`.
- Add wrapper-local spacing for `.rankland-ranklist-select.ml-2`.
- Add wrapper-local spacing for `.rankland-ranklist-checkbox .mr-1`.
- Keep Select `ml-2` / `160px`, official wrapper `ml-5 inline-flex items-center`, official text `mr-1`, and marker filter `ml-5 inline-flex items-center`.
- Preserve desktop and mobile filter behavior, selected-tag behavior, official-only behavior, marker filtering, and existing viewport guards.

## Non-Goals

- Do not rewrite filter wrapper DOM from labels into exact old React child nodes in this slice.
- Do not remove stable `data-id` selectors.
- Do not change the recently restored mobile row layout.
- Do not alter progress bar, table, modals, footer, or route state behavior.
- Do not hand-edit generated router outputs.

## Test Strategy

Use `tests/e2e/full-chain/ranklist.spec.ts` because this is browser-visible CSS/layout behavior after Vue scoped CSS and Ant Design Vue styles are applied.

Focused RED:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls and preserves filtering behavior"
```

Expected initial failure: current Vue reports wrapper column gaps as non-zero. After removing the wrapper gaps, the test should also prove the old utility spacing is supplied locally by keeping the actual visual gaps at `8px` and `4px`.

Focused GREEN: the same command passes after removing the Vue-only wrapper gaps.

Ranklist regression:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Full gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- Organization label-to-Select visual gap is `8px`.
- Official text-to-Switch visual gap is `4px`.
- Organization and checkbox wrapper computed column gaps are `normal`, proving no wrapper `gap` is declared.
- Existing filter utility classes remain present.
- Existing mobile row layout remains green.
- Existing filter interactions and Ranklist full-chain behavior remain green.
- Migration status and final review record the verified slice and gate evidence.
