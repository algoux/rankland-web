# SRK Modal Table Wrapper DOM Parity Design

## Goal

Restore the old React SRK modal placement relative to the table wrapper.

## Source Behavior

`rankland-fe/src/components/StyledRanklistRenderer.tsx` renders the table area as:

```tsx
<div className={tableClass} style={tableStyle}>
  {staticData.remarks && <div className="mb-4 text-center">...</div>}
  <RankTimeDataContext.Provider value={rankTimeData}>
    <Ranklist ... />
    <Modal ...>
      <UserInfoModal ... />
    </Modal>
    <DefaultSolutionModal ... />
  </RankTimeDataContext.Provider>
</div>
{showFooter && <div className="text-center mt-8">...</div>}
```

The migrated Vue wrapper currently renders the table wrapper, then footer, then user/solution modal wrapper nodes. That leaves the modal roots as siblings after the footer instead of descendants of the table wrapper.

## Target Behavior

- Keep the existing `[data-id="rankland-ranklist-user-modal"]` and `[data-id="rankland-ranklist-solution-modal"]` hooks.
- Render both modal wrapper nodes inside `[data-id="rankland-ranklist-table-wrapper"]`, immediately after the low-level `<Ranklist />`.
- Keep the footer after the table wrapper, matching old React order.
- Preserve modal open/close behavior, root classes, titles, body content, responsive width, chart behavior, and solution modal behavior.

## Non-goals

- Do not change modal styling, animation, teleport behavior, or root class names.
- Do not change footer DOM, table wrapper class attributes, table spacer, or low-level table rendering.
- Do not pursue broader table pixel parity in this slice.

## Test Strategy

Use the existing `/ranklist/:id` full-chain route because it opens both the user modal and a solution modal.

Add a DOM helper that checks whether the user and solution modal wrapper nodes are descendants of `[data-id="rankland-ranklist-table-wrapper"]` and whether the footer remains outside that wrapper. RED should fail because the current Vue template renders modal wrapper nodes outside the table wrapper.

## Acceptance Criteria

- `[data-id="rankland-ranklist-user-modal"]` has `[data-id="rankland-ranklist-table-wrapper"]` as an ancestor.
- `[data-id="rankland-ranklist-solution-modal"]` has `[data-id="rankland-ranklist-table-wrapper"]` as an ancestor.
- `[data-id="rankland-ranklist-footer"]` remains outside `[data-id="rankland-ranklist-table-wrapper"]`.
- Existing modal content, root-class, user detail, rank-time, and solution modal full-chain checks continue to pass.
- Full migration gate passes.
