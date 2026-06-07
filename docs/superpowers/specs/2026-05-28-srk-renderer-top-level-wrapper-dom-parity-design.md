# SRK Renderer Top-Level Wrapper DOM Parity Design

## Context

Old `rankland-fe/src/components/StyledRanklistRenderer.tsx` renders the normal SRK surface as direct children under `ErrorBoundary`: banner wrapper, title, metadata block, time, progress, controls, spacer, table wrapper, and optional footer. It does not emit a product root wrapper around the renderer, and `renderHeader()` returns a fragment rather than a `header` element.

The Vue migration still emits:

```vue
<div class="rankland-ranklist">
  <header v-if="showHeader" class="rankland-ranklist-header">
    ...
  </header>
  ...
</div>
```

Those wrappers are Vue-only product DOM. The root wrapper also adds `width: 100%` and `overflow-x: auto`, which old React did not add at this layer.

## Scope

- `src/client/components/rankland-ranklist.vue`
  - Remove the normal-path root `.rankland-ranklist` wrapper.
  - Replace `header.rankland-ranklist-header` with a fragment guarded by `showHeader`.
  - Keep existing stable `data-id` hooks on real product nodes.
  - Move link color and title typography styles off the removed wrappers and onto direct anchors / existing `data-id` hooks.
  - Keep check-error and render-error states functional.
- `tests/e2e/full-chain/ranklist.spec.ts`
  - Assert the loaded Ranklist route does not render `.rankland-ranklist` or `.rankland-ranklist-header`.
  - Assert the SRK renderer's direct children under `ranklist-content` follow the old React top-level order after the hidden hydration marker.
- Migration docs record the verified slice.

## Non-Goals

- Do not change lower-level `@algoux/standard-ranklist-component-core` table DOM.
- Do not change Ranklist data conversion, filtering, progress, modals, export/share actions, footer content, or route wrappers.
- Do not remove stable `data-id` selectors used by full-chain tests.
- Do not change check-error or render-error visual copy in this slice.

## Test Strategy

Use the existing Ranklist full-chain test because the mismatch is route-visible DOM from the shared SRK renderer.

RED:

- Add assertions that `.rankland-ranklist` and `.rankland-ranklist-header` are absent.
- Add a direct-child DOM assertion for `[data-id="ranklist-content"]` that skips `[data-id="ranklist-hydrated"]` and expects the first old renderer nodes to be:
  - banner wrapper `DIV.flex.items-center.justify-center`
  - title `H1.text-center.mb-1`
  - metadata `DIV.text-center.mt-1`
  - time `P.text-center.mb-0`
  - progress `DIV.mx-4`
  - controls `DIV.mt-3.mx-4.flex.justify-between.items-center`
  - spacer `DIV.mt-6`
  - table wrapper `DIV.ml-4`
  - footer `FOOTER.text-center.mt-8`
- The focused Ranklist test must fail because current Vue renders the `.rankland-ranklist` root and `header.rankland-ranklist-header`.

GREEN:

- Remove the wrappers and update wrapper-dependent styles.
- Re-run the focused Ranklist test, then the full Ranklist, Collection, Playground, and Live full-chain files because the shared renderer is used by all four routes.

Full gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- Normal SRK rendering no longer includes `.rankland-ranklist` or `.rankland-ranklist-header`.
- Ranklist route direct renderer children match the old React top-level order after the hidden hydration marker.
- Existing header typography, link colors, export/share behavior, filters, progress, table wrapper offset, modals, footer, and viewport bounds remain covered by existing tests.
- Full migration gate passes before commit.
