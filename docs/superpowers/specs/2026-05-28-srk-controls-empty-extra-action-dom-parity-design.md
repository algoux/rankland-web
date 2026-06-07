# SRK Controls Empty Extra-Action DOM Parity Design

## Goal

Restore the old React `StyledRanklistRenderer` controls-row right-side placeholder DOM when no extra action is provided.

## Old React Evidence

`rankland-fe/src/components/StyledRanklistRenderer.tsx` always renders a second child `div` inside the controls row:

```tsx
<div className="mt-3 mx-4 flex justify-between items-center">
  {showFilter && (
    <div>
      ...
    </div>
  )}
  <div>{renderExtraActionArea ? renderExtraActionArea(memorizedData) : null}</div>
</div>
```

For normal `/ranklist/:id`, `renderExtraActionArea` is not passed, so the right-side child remains an empty plain `DIV`.

## Current Vue Gap

`src/client/components/rankland-ranklist.vue` currently renders the right-side extra-action wrapper only when a slot exists:

```vue
<div v-if="hasExtraAction" data-id="rankland-ranklist-extra-action">
  <slot name="extra-action" :ranklist="ranklist" />
</div>
```

That preserves Live's visible extra action but misses the empty placeholder DOM on normal ranklist routes.

## Scope

- Add ranklist full-chain coverage for the controls root direct children.
- Render an always-present plain `DIV` extra-action wrapper inside controls.
- Keep existing `data-id="rankland-ranklist-extra-action"` for stable selectors and existing Live tests.
- Preserve Live scroll-solution extra-action behavior and controls chrome.
- Update migration docs and this slice plan with RED/GREEN/full-gate evidence.

## Non-Goals

- No layout or spacing changes beyond restoring the empty placeholder DOM.
- No low-level SRK table pixel work.
- No changes to Live scroll-solution toggle contents.
- No changes to filter controls, Ant Design components, or slot API.

## Test Strategy

- Focused full-chain RED: `/ranklist/:id` should fail because controls only have the filters child and no empty extra-action child.
- Focused full-chain GREEN: same ranklist test should pass after the empty wrapper is always rendered.
- Full migration gate after docs are updated.

## Acceptance Criteria

- `tests/e2e/full-chain/ranklist.spec.ts` verifies controls direct children include:
  - `DIV[data-id="rankland-ranklist-filters"]`
  - `DIV[data-id="rankland-ranklist-extra-action"]` with an empty class list and empty text on normal ranklist.
- Existing Live full-chain coverage for populated extra action remains valid.
- Full gate passes:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```
