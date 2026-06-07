# Ranklist View Count Icon Parity Design

## Goal

Restore the old React ranklist header view-count presentation in the Vue SRK wrapper.

## Old React Baseline

`rankland-fe/src/components/StyledRanklistRenderer.tsx` renders the header metadata view count as an Ant Design eye icon followed by the count:

```tsx
{meta && (
  <span className="mr-2">
    <EyeOutlined /> {meta.viewCnt || '-'}
  </span>
)}
```

For the standard fixture value `42`, the visible text is `42`, not `浏览 42`, and the icon class is `anticon-eye`.

## Current Vue Gap

`src/client/components/rankland-ranklist.vue` currently renders:

```vue
<span v-if="hasViewCount" data-id="rankland-ranklist-view-count" class="rankland-ranklist-view-count">
  浏览 {{ meta.viewCnt }}
</span>
```

That keeps the count visible, but the text and icon treatment differ from the old product header.

## Scope

- Update `/ranklist/:id` full-chain coverage to assert the old `42` text and `.anticon-eye` icon.
- Update `/collection/:id` selected-ranklist full-chain coverage for the same shared wrapper behavior.
- Render `EyeOutlined` in the shared ranklist header view-count span.
- Preserve the existing `data-id`, header layout, and metadata visibility semantics.
- Update migration status after verification.

## Non-Goals

- Do not change search result cards, which have their own list-card view-count presentation.
- Do not change export/share icon triggers, reference links, contributors, or header time formatting.
- Do not change API metadata loading.

## Test Strategy

Use existing full-chain tests for `/ranklist/:id` and `/collection/:id`, because both routes exercise the shared SRK wrapper with `meta.viewCnt = 42`. The tests should fail before implementation because the text is still `浏览 42` and the `.anticon-eye` icon is absent.

## Acceptance Criteria

- Focused ranklist/collection full-chain tests fail before implementation for the old view-count contract.
- Focused ranklist/collection full-chain tests pass after implementation.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- `docs/migration/status.md` records this verified slice.
