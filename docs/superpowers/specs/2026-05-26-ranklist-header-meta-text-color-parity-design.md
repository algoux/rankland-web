# Ranklist Header Meta Text Color Parity Design

## Goal

Restore old React header meta text color behavior for the shared ranklist header.

This covers the non-link header metadata around the SRK renderer:

- view count;
- contributors/ref-link label text;
- hidden ref-link trigger text;
- contest time range.

## Old React Baseline

`rankland-fe/src/components/StyledRanklistRenderer.tsx` renders the metadata without custom text-color classes:

```tsx
<div className="text-center mt-1">
  {meta && (
    <span className="mr-2">
      <EyeOutlined /> {meta.viewCnt || '-'}
    </span>
  )}
  ...
  <p className="mb-0">贡献者：{renderContributors(staticData.contributors)}</p>
  {renderContestRefLinks(staticData.contest.refLinks)}
</div>
...
<p className="text-center mb-0">
  {dayjs(startAt).format('YYYY-MM-DD HH:mm:ss')} ~ {dayjs(endAt).format('YYYY-MM-DD HH:mm:ss Z')}
</p>
```

The old Ant Design styles set the theme body text color:

- light: `rgba(0, 0, 0, 0.85)`;
- dark: `rgba(255, 255, 255, 0.85)`.

Because the old header meta text does not override `color`, it inherits those theme colors. Links still use the old primary link colors.

## Current Vue Gap

`src/client/components/rankland-ranklist.vue` hard-codes slate colors:

```less
.rankland-ranklist-view-count {
  color: #475569;
}

.rankland-ranklist-contributors,
.rankland-ranklist-ref-links {
  color: #475569;
}

.rankland-ranklist-time {
  color: #64748b;
}
```

This diverges from old React in both light and dark mode. The dark route keeps muted slate metadata instead of the old Ant Design dark body text color.

## Scope

- Add theme variables for old Ant Design body text color.
- Use the variable for ranklist header metadata and contest time.
- Preserve old primary link colors and hover colors for actual `<a>` elements.
- Preserve the hidden ref-link trigger inherited text-color behavior from the previous slice.
- Add full-chain coverage on `/ranklist/:id` in light and dark modes.

## Non-Goals

- Do not change global body text color in this slice.
- Do not alter header spacing, dropdown behavior, ref-link slicing, or link primary colors.
- Do not change low-level SRK table styles.
- Do not touch generated router files.

## Test Strategy

Extend `tests/e2e/full-chain/ranklist.spec.ts`:

- Light main route test asserts view count, ref-link paragraph, extra ref-link trigger, and time text use `rgba(0, 0, 0, 0.85)`.
- Light main route test also keeps actual ref-link `<a>` and footer contact trigger on old light primary `rgb(255, 129, 4)`.
- Dark theme route test asserts ref-link paragraph and extra trigger use `rgba(255, 255, 255, 0.85)`, while actual ref-link `<a>` and footer contact trigger remain `rgb(246, 172, 6)`.

The RED run should fail because current Vue returns `rgb(71, 85, 105)` for ref-link meta text and `rgb(100, 116, 139)` for the time text.

## Acceptance Criteria

- Focused full-chain test fails before implementation with the expected slate-color mismatch.
- Focused full-chain test passes after implementation.
- Ranklist full-chain spec remains green.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.
- Migration docs record this verified slice.
