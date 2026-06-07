# Ranklist Extra Ref Link Trigger Color Parity Design

## Goal

Restore the old React header treatment for the hidden contest reference-link trigger, the `and N more` span shown when a contest has more than three `refLinks`.

## Old React Baseline

`rankland-fe/src/components/StyledRanklistRenderer.tsx` renders hidden ref links with an Ant Design `Dropdown` trigger:

```tsx
<span style={{ cursor: 'pointer' }}>
  and {hiddenLinks.length} more <CaretDownOutlined />
</span>
```

The trigger is a plain `span`. It does not receive link primary color, so it inherits the surrounding header meta text color. The actual hidden menu entries remain links and keep normal link color.

## Current Vue Gap

`src/client/components/rankland-ranklist.vue` renders the same trigger as `.rankland-ranklist-ref-link-extra-action`, but the scoped CSS sets:

```less
color: #1677ff;
```

That makes the trigger look like a primary Ant Design link, while the old React UI treated it as inline meta text with only pointer affordance and the caret icon.

## Scope

- Keep the existing `a-dropdown` behavior, hover trigger, caret icon, and menu contents.
- Change only the extra ref-link trigger color behavior so it inherits the surrounding ref-link paragraph text color.
- Add full-chain coverage on `/ranklist/:id` because the fixture already includes four `contest.refLinks`.
- Keep the actual visible and hidden `<a>` links on the restored RankLand primary link color.

## Non-Goals

- Do not change link slicing, dropdown placement, menu item labels, or hidden link URLs.
- Do not alter header meta spacing, table layout, or SRK low-level renderer styles.
- Do not change global body text color or Ant Design Vue theme tokens in this slice.
- Do not touch generated router files.

## Test Strategy

Extend the main `/ranklist/:id` full-chain test:

- read computed color for `[data-id="rankland-ranklist-ref-links"]`;
- read computed color for `[data-id="rankland-ranklist-ref-link-extra-action"]`;
- assert both colors are equal;
- assert the trigger color is not equal to the primary ref-link `<a>` color.

The RED run should fail because the current Vue trigger is `rgb(22, 119, 255)` while the surrounding ref-link paragraph is `rgb(71, 85, 105)`.

## Acceptance Criteria

- Focused ranklist full-chain test fails before implementation for the expected color mismatch.
- Focused ranklist full-chain test passes after implementation.
- Existing hover dropdown coverage for the extra ref-link menu stays green.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- `docs/migration/status.md` records this verified slice and the remaining review-driven parity queue.
