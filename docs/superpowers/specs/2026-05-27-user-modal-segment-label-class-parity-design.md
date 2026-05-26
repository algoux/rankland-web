# User Modal Segment Label Class Parity Design

## Goal

Restore the old React user-modal segment label class in the shared SRK renderer.

## Source Behavior

`rankland-fe/src/components/UserInfoModal.tsx` renders the award/segment label as:

```tsx
<span className={`user-modal-segment-label bg-segment-${matchedSeriesSegment.style}`}>
  {matchedSeriesSegment.title}
</span>
```

`UserInfoModal.less` scopes the label box model under `.user-modal .user-modal-segment-label`, including inline-block display, `4px` padding, `4px` border radius, and white foreground color.

## Target Behavior

- The Vue segment label keeps the stable `[data-id="rankland-user-modal-segment-label"]` selector and `.rankland-user-modal-segment-label` class.
- The same label element also carries the old `.user-modal-segment-label` class.
- Existing `bg-segment-*` classes, label text, segment line spacing, and user modal behavior remain unchanged.

## Non-goals

- Do not change how the matched segment is calculated.
- Do not change segment colors, padding, border radius, or text.
- Do not alter other user modal classes in this slice.

## Test Strategy

- Extend the existing `/ranklist/:id` full-chain user-modal test.
- After opening `Team Alpha`, assert the segment label text remains `Gold`, the `bg-segment-gold` class remains present, and the same element has the old `.user-modal-segment-label` class as an independent class token.
- Verify RED before implementation.
- Run focused GREEN, then full migration gate.

## Acceptance

- Focused ranklist test fails before implementation because the Vue segment label lacks `.user-modal-segment-label`.
- Focused ranklist test passes after implementation.
- Full migration gate passes:
  `node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check`.
