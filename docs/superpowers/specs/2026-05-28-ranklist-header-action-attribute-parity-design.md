# Ranklist Header Action Attribute Parity Design

## Context

Old `rankland-fe/src/components/StyledRanklistRenderer.tsx` renders the SRK header export and share triggers as plain `<a>` nodes with utility classes only. They do not include `href`, `title`, or `aria-label` attributes. The Vue migration already restored the anchor tag, no-`href` behavior, runtime Ant Design `ant-dropdown-trigger` class, and old utility class lists, but it still emits `title="导出"` / `aria-label="导出"` and `title="分享"` / `aria-label="分享"`.

Those extra attributes create native browser tooltip behavior that the old React page did not expose. This slice removes only those extra attributes to tighten product DOM parity.

## Scope

- `src/client/components/rankland-ranklist.vue`
  - Remove `title` and `aria-label` from `data-id="rankland-ranklist-export-menu-button"`.
  - Remove `title` and `aria-label` from `data-id="rankland-ranklist-share-menu-button"`.
- `tests/e2e/full-chain/ranklist.spec.ts`
  - Assert Ranklist header export/share trigger anchors do not emit `title` or `aria-label`.
- `tests/e2e/full-chain/live.spec.ts`
  - Assert Live no-metadata header export/share trigger anchors do not emit `title` or `aria-label`.
- Migration docs record the verified slice and leave lower-level SRK table pixel parity product-review-driven.

## Non-Goals

- Do not change trigger tag names, `href` behavior, classes, menu overlays, export/share actions, notification behavior, or copy/embed output.
- Do not remove the stable `data-id` hooks.
- Do not pursue root wrapper or lower-level SRK table pixel parity in this slice.

## Test Strategy

Use full-chain Playwright coverage because the relevant attributes are browser-visible runtime DOM on Ant Design Vue dropdown trigger elements.

RED:

- Add assertions that each export/share trigger has `title === null` and `aria-label === null`.
- Focused Ranklist and Live specs must fail because current Vue emits those attributes.

GREEN:

- Remove the four attributes from the Vue template.
- Re-run focused Ranklist and Live specs.
- Run full Ranklist and Live full-chain files to guard dropdown interaction and route behavior.

Full gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- Ranklist metadata path export/share triggers remain no-`href` `<a>` nodes with the old utility class list plus runtime `ant-dropdown-trigger`.
- Live no-metadata path export/share triggers remain no-`href` `<a>` nodes with the old utility class list plus runtime `ant-dropdown-trigger`.
- Both paths omit `title` and `aria-label` on export/share triggers.
- Existing export/share dropdowns and actions still pass full-chain regression.
