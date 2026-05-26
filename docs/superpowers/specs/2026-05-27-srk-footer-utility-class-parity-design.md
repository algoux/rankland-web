# SRK Footer Utility Class Parity Design

## Context

The old React `StyledRanklistRenderer` renders the shared SRK footer with legacy Tailwind utility class tokens:

```tsx
<div className="text-center mt-8">
  <p className="mb-0">© 2022-present algoUX. All Rights Reserved.</p>
  <p className="mt-1 mb-0">Find us on ...</p>
  <p className="mt-1 mb-0">Powered by ...</p>
  <p className="mt-1 mb-0">欢迎补充榜单数据至 ...</p>
  <p className="mt-1 mb-0">需要专业的赛事外榜托管？...</p>
  {process.env.SITE_ALIAS === 'cnn' && <p className="mt-1 mb-0">备案号：...</p>}
</div>
```

The migrated Vue footer already preserves the visible 32px top spacing, centered alignment, and 4px paragraph spacing through scoped CSS, but it does not expose the old utility class tokens on the footer DOM.

## Decision

Restore the old footer utility class tokens alongside the migrated hooks:

- footer root: keep `rankland-ranklist-footer`, add `text-center mt-8`;
- first paragraph: add `mb-0`;
- all subsequent footer paragraphs, including conditional beian: add `mt-1 mb-0`.

Do not introduce global utility CSS or move footer rendering. The existing scoped `.rankland-ranklist-footer` styles remain the source of computed visual spacing.

## Scope

In scope:

- `src/client/components/rankland-ranklist.vue` footer DOM class tokens.
- Focused `/ranklist/:id` full-chain assertions for footer class parity.
- Migration docs after verification.

Out of scope:

- Footer copy, links, beian environment logic, contact modal behavior, or route-level spacing.
- Low-level SRK table rendering.
- Adding global Tailwind utility styles.

## Test Strategy

Extend the main ranklist full-chain route test because it renders the shared SRK footer with all default non-beian footer lines. Assert:

- `[data-id="rankland-ranklist-footer"]` includes `text-center` and `mt-8`;
- the first footer paragraph includes `mb-0`;
- the following footer paragraphs include both `mt-1` and `mb-0`;
- existing computed paragraph spacing remains unchanged.

The focused RED should fail before implementation because the Vue footer lacks those old class tokens.

## Acceptance Criteria

- Focused ranklist full-chain test fails before implementation for missing footer utility class tokens.
- Focused ranklist full-chain test passes after implementation.
- Existing footer spacing, contact modal, and default non-beian behavior stay green.
- Full migration gate passes: `gen:client-router`, `test:migration`, and `git diff --check`.
