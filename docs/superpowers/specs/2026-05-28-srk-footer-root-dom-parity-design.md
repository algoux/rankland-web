# SRK Footer Root DOM Parity Design

## Goal

Restore the old React `StyledRanklistRenderer` footer root DOM tag in the shared Vue SRK wrapper.

## Old React Evidence

`rankland-fe/src/components/StyledRanklistRenderer.tsx` renders the SRK footer as:

```tsx
{showFooter && (
  <div className="text-center mt-8">
    <p className="mb-0">...</p>
  </div>
)}
```

The root node is a plain `DIV`, not a semantic `FOOTER`.

## Current Vue Gap

`src/client/components/rankland-ranklist.vue` already restores the old footer utility classes, paragraph classes, links, ContactUs trigger, and conditional beian behavior, but the root node is still:

```vue
<footer v-if="showFooter" data-id="rankland-ranklist-footer" class="text-center mt-8">
```

Existing tests do not assert the root tag name.

## Scope

- Add full-chain coverage for `[data-id="rankland-ranklist-footer"]` tagName.
- Change the shared SRK footer root from `footer` to `div`.
- Update migration docs and this slice plan with RED/GREEN/full-gate evidence.

## Non-Goals

- No footer text, link, ContactUs, beian, spacing, or color changes.
- No low-level SRK table pixel work.
- No route-specific footer behavior changes outside the shared wrapper.

## Test Strategy

- Focused full-chain RED: `/ranklist/:id` should fail while the footer tag is still `FOOTER`.
- Focused full-chain GREEN: same test should pass after the root becomes `DIV`.
- Full migration gate after docs are updated.

## Acceptance Criteria

- `tests/e2e/full-chain/ranklist.spec.ts` verifies footer root `tagName === 'DIV'` and keeps existing footer class/link/contact assertions.
- `src/client/components/rankland-ranklist.vue` renders `div[data-id="rankland-ranklist-footer"].text-center.mt-8`.
- Full gate passes:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```
