# SRK Header View Count Fallback Parity Design

## Context

Old React `StyledRanklistRenderer` rendered the header view-count block whenever `meta` was present and used `meta.viewCnt || '-'` as the visible value. The Vue renderer currently renders the block only when `meta.viewCnt` is a number, so API metadata without `viewCnt` hides the old eye icon and fallback text.

## Requirement

When a ranklist route passes a metadata object to `RanklandRanklist`, the header must show the view-count block. If `viewCnt` is missing or falsy, the visible text is `-` and the eye icon remains visible.

## Scope

- Keep the existing header layout, classes, and data ids.
- Do not change search/list cards or API interfaces in this slice.
- Add full-chain coverage through `/ranklist/:id` using a mock backend ranklist metadata response without `viewCnt`.

## Acceptance

- `/ranklist/no-view-count-key` renders `[data-id="rankland-ranklist-view-count"]` with text `-`.
- The eye icon inside that block remains visible.
- Existing ranklist behavior with `viewCnt: 42` remains unchanged.
