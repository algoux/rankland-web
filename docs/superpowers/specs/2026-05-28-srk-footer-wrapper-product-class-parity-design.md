# SRK Footer Wrapper Product Class Parity Design

Date: 2026-05-28
Branch: `migration/live-page-foundation`
Slice: SRK footer wrapper product class parity

## Problem

Old React `StyledRanklistRenderer` renders the shared SRK footer root as:

```tsx
<div className="text-center mt-8">
```

The migrated Vue wrapper currently renders:

```vue
<footer data-id="rankland-ranklist-footer" class="rankland-ranklist-footer text-center mt-8">
```

The old utility tokens and computed footer spacing are covered, but the Vue-only `rankland-ranklist-footer` product class still leaks into the public DOM. This differs from the old React class contract and from the recent SRK wrapper product-class cleanup slices.

## Scope

- Remove only the Vue-only footer root product class.
- Keep the stable `data-id="rankland-ranklist-footer"` hook for tests and scoped styles.
- Preserve old footer root utility tokens: `text-center mt-8`.
- Preserve footer paragraph utility tokens: first line `mb-0`, following lines `mt-1 mb-0`.
- Preserve existing footer text, external links, omitted `rel`, ContactUs trigger DOM, conditional beian row, and link colors.

## Non-Goals

- Do not change footer copy or link hrefs.
- Do not change ContactUs, beian, or external-link behavior.
- Do not change Ranklist table, controls, header, modals, or low-level SRK renderer internals.
- Do not hand-edit generated route outputs.

## Test Strategy

Extend the existing Ranklist full-chain footer assertions:

- top-level SRK DOM helper expects footer root class list exactly `['text-center', 'mt-8']`;
- footer utility helper expects the same exact root class list and explicitly rejects `rankland-ranklist-footer`;
- existing paragraph class, spacing, link, ContactUs, and beian assertions remain in place.

Then retarget scoped footer styles from `.rankland-ranklist-footer` to `[data-id='rankland-ranklist-footer'].text-center.mt-8`.

## Acceptance Criteria

- Focused Ranklist full-chain test fails before implementation because current Vue still emits `rankland-ranklist-footer`.
- Focused Ranklist full-chain test passes after implementation.
- Full Ranklist full-chain file passes.
- Full migration gate passes before commit.
- `git diff --check` passes.
- Migration status, manual checklist, final integration review, and this slice plan record the evidence.

## Risks

The shared footer is rendered by Ranklist, Collection selected-ranklist, Playground preview, and Live. Retargeted scoped CSS must preserve existing spacing and link-color behavior across shared surfaces while avoiding a broad class selector.
