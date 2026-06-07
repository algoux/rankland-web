# User Modal Wrap Class Parity Design

## Goal

Restore old React product DOM parity for the SRK user modal wrap element by removing the Vue-only `rankland-user-modal` class from `.srk-modal-wrap`.

## Old React Baseline

Old `rankland-fe/src/components/StyledRanklistRenderer.tsx` renders the user info modal with:

```tsx
<Modal
  open={userModalOpen && !!activeUser && !!activeUserRow}
  title={activeUser ? resolveText(activeUser.name) : undefined}
  width={clientWidth >= 980 ? 960 : clientWidth - 20}
  rootClassName="srk-general-modal-root"
  onClose={handleUserModalClose}
>
```

It does not pass `wrapClassName`. In `@algoux/standard-ranklist-renderer-component-react@0.5.1`, `Modal` renders the wrap as:

```tsx
className={classnames("srk-modal-wrap", wrapClassName)}
```

Therefore the old user modal product DOM has only `srk-modal-wrap` on the wrap element.

## Current Vue Gap

`src/client/components/rankland-ranklist.vue` currently passes:

```vue
wrap-class-name="rankland-user-modal"
```

This adds a Vue-only product class to the SRK user modal wrap. Existing tests cover the modal root classes and user-modal body/product class parity, but not the wrap class.

## Scope

- Add a focused Ranklist full-chain assertion for the user modal wrap class list.
- Remove `wrap-class-name="rankland-user-modal"` from the user modal `Modal` invocation.
- Retarget any tests that use `.rankland-user-modal` as a selector to stable existing hooks.
- Update migration docs and this slice plan.

## Non-Goals

- Do not change solution modal wrap behavior; old `DefaultSolutionModal` defaults to `srk-solutions-modal`.
- Do not change modal root classes, animation behavior, responsive width, body content, or user modal internal DOM.
- Do not remove unrelated stale CSS in this slice unless a test proves it is product-visible.

## Acceptance Criteria

- Focused RED proves current Vue renders `rankland-user-modal` on the user modal `.srk-modal-wrap`.
- Focused GREEN proves user modal wrap classes are exactly `['srk-modal-wrap']`.
- Existing user modal body, modal root, broken asset, responsive width, and solution modal behavior remain covered.
- Full migration gate passes before commit.
