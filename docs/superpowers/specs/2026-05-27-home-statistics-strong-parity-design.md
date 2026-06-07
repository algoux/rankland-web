# Home Statistics Strong Parity Design

## Goal

Restore the old React home recommendation card markup and typography for the total SRK count.

The old `rankland-fe/src/pages/index.tsx` renders:

```tsx
在 <strong>{data?.statistics.totalSrkCount ?? '-'}</strong> 个高质量程序设计竞赛榜单中自由浏览和搜索
```

The migrated Vue home page currently renders the same value with `<em>`, which changes the visible typography from bold emphasis to italic emphasis. This is a product-level home parity issue.

## Scope

- Add full-chain coverage proving the total SRK count is rendered in a `strong` element.
- Assert the visible typography is not italic and is bold like the legacy browser/Ant Design default.
- Change the Vue home markup from `em` to `strong` while keeping the existing `data-id` selector and nullish `-` fallback.
- Update migration status and review docs after verification.

## Non-Goals

- Do not change the statistics API, SSR loading, or nullish fallback behavior.
- Do not change recommendation card layout, card title icons, or other home sections.
- Do not change generated route files.

## Acceptance Criteria

- Normal `/` full-chain rendering shows `home-total-srk-count` as `STRONG`.
- The computed style for that element has `font-style: normal` and a bold weight.
- Partial upstream statistics still render `-` inside the same `STRONG` element on SSR and after hydration.
- Full migration gate passes: `gen:client-router`, `test:migration`, and `git diff --check`.
