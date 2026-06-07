# User Modal Segment Line Class Parity Design

## Goal

Restore the old React user-modal segment line spacing classes in the shared SRK renderer.

## Source Behavior

`rankland-fe/src/components/UserInfoModal.tsx` renders the award/segment line as:

```tsx
<p className="mt-4 mb-0">
  所在奖区（{matchedMainSeries.title}）：
  <span className={`user-modal-segment-label bg-segment-${matchedSeriesSegment.style}`}>
    {matchedSeriesSegment.title}
  </span>
</p>
```

The old DOM exposes `mt-4` and `mb-0` on the line itself. Prior slices already restored the visible `16px` top margin and zero bottom margin, and the segment label now carries the old `.user-modal-segment-label` class.

## Target Behavior

- The Vue segment line keeps `[data-id="rankland-user-modal-segment"]`, `.rankland-user-modal-line`, and `.rankland-user-modal-segment`.
- The same line also carries old `mt-4` and `mb-0` class tokens.
- Existing computed spacing, label text, label class, and `bg-segment-*` behavior remain unchanged.

## Non-goals

- Do not introduce or rely on global utility CSS for `mt-4` / `mb-0`; the existing scoped `.rankland-user-modal-segment` rule remains the style source.
- Do not change segment matching, label text, or segment color behavior.
- Do not alter unrelated user-modal lines in this slice.

## Test Strategy

- Extend the existing `/ranklist/:id` full-chain user-modal test.
- After opening `Team Alpha`, assert the segment line contains `所在奖区（Rank）：`, still computes `16px` top margin and `0px` bottom margin, and includes old `mt-4` and `mb-0` class tokens.
- Verify RED before implementation.
- Run focused GREEN, then full migration gate.

## Acceptance

- Focused ranklist test fails before implementation because the Vue segment line lacks `mt-4` and `mb-0`.
- Focused ranklist test passes after implementation.
- Full migration gate passes:
  `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
