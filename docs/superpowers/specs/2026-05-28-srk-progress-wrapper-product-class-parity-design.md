# SRK Progress Wrapper Product Class Parity Design

## Context

Old React `rankland-fe/src/components/StyledRanklistRenderer.tsx` renders the progress wrapper as:

```tsx
<div className="mx-4">
  <ProgressBar
    data={memorizedData}
    enableTimeTravel
    onTimeTravel={handleTimeTravel}
    live={isLive}
  />
</div>
```

The migrated Vue wrapper already restores the old `mx-4` utility token and computed 16px horizontal margins, but it still exposes a Vue-only product class:

```vue
<div v-if="showProgress" data-id="rankland-ranklist-progress" class="rankland-ranklist-progress mx-4">
```

Previous progress utility-class parity intentionally kept `.rankland-ranklist-progress` as a hook. This follow-up can now remove that product class because the stable `data-id` is sufficient for tests and scoped CSS.

## Goal

Restore old React progress wrapper class parity by removing `.rankland-ranklist-progress` from product DOM while preserving the progress bar behavior, spacing, mobile wrapping override, and stable test hook.

## Scope

- Change the shared SRK progress wrapper class list from `rankland-ranklist-progress mx-4` to exact `mx-4`.
- Keep `data-id="rankland-ranklist-progress"`.
- Move scoped progress and mobile ProgressBar descendant CSS from `.rankland-ranklist-progress` to `[data-id='rankland-ranklist-progress'].mx-4`.
- Update full-chain assertions to reject the Vue-only product class and preserve computed margins/mobile behavior.

## Non-Goals

- Do not change `ProgressBar` props, time-travel behavior, live progress behavior, or low-level progress component styling.
- Do not change route-level spacing, controls, table spacer, footer, or modals.
- Do not remove stable `data-id` selectors.
- Do not hand-edit generated router output.

## Test Strategy

Focused RED:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
```

Expected initial failure: current Vue reports `rankland-ranklist-progress` in the progress wrapper class list.

Focused GREEN: the same command passes after removing the product class and preserving computed margins and descendant ProgressBar presentation.

Ranklist regression:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Full migration gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- `[data-id="rankland-ranklist-progress"]` exists when progress is shown.
- Its class list is exactly `mx-4`.
- It does not contain `.rankland-ranklist-progress`.
- Computed left/right margins remain `16px`.
- Existing ranklist, collection, playground, and live full-chain progress coverage remains green.
