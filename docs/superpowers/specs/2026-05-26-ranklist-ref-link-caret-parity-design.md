# Ranklist Ref Link Caret Parity Design

## Goal

Restore the old React caret icon on the ranklist header hidden reference-link dropdown trigger.

## Old React Baseline

`rankland-fe/src/components/StyledRanklistRenderer.tsx` renders hidden contest reference links with this trigger:

```tsx
<span style={{ cursor: 'pointer' }}>
  and {hiddenLinks.length} more <CaretDownOutlined />
</span>
```

The visible contract is the `and N more` text followed by the Ant Design caret-down icon.

## Current Vue Gap

`src/client/components/rankland-ranklist.vue` currently renders only the text:

```vue
<span data-id="rankland-ranklist-ref-link-extra-action">
  and {{ extraRefLinks.length }} more
</span>
```

The dropdown behavior is covered, but the old icon cue is missing.

## Scope

- Add full-chain coverage for `.anticon-caret-down` inside the existing extra ref-link trigger.
- Render `CaretDownOutlined` after the existing text.
- Preserve the existing trigger `data-id`, text content, hover dropdown behavior, and extra link menu.
- Update migration status after verification.

## Non-Goals

- Do not change the number of visible reference links.
- Do not change hidden link menu contents or link targets.
- Do not change contributor rendering or export/share controls.

## Test Strategy

Extend the existing `/ranklist/:id` full-chain test that already asserts `and 1 more` and hover dropdown behavior. The icon assertion should fail before implementation and pass after rendering the caret component.

## Acceptance Criteria

- Focused ranklist full-chain test fails before implementation because `.anticon-caret-down` is absent.
- Focused ranklist full-chain test passes after implementation.
- Existing hidden ref-link hover coverage remains green.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- `docs/migration/status.md` records this verified slice.
