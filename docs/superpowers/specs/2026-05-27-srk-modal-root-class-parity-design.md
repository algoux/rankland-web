# SRK Modal Root Class Parity Design

## Context

The old React SRK renderer package adds `srk-react-modal-root` to every SRK modal root:

```tsx
className={classnames(
  'srk-modal-root',
  SRK_ANIMATED_MODAL_ROOT_CLASS,
  'srk-react-modal-root',
  rootClassName,
)}
```

`StyledRanklistRenderer` passes `rootClassName="srk-general-modal-root"` for the custom user modal and lets `DefaultSolutionModal` use the same default root class. The migrated Vue renderer package keeps the shared animated modal class but does not include `srk-react-modal-root` unless the caller passes it through `root-class-name`.

The shared stylesheet still targets both `.srk-animated-modal-root` and `.srk-react-modal-root`, so the missing class does not currently break modal animation. It is still a product restoration gap because old DOM/class hooks are part of the verified SRK wrapper parity surface.

## Decision

Pass the old React modal root class through the Vue modal props:

- custom user modal: `root-class-name="srk-general-modal-root srk-react-modal-root"`;
- default solution modal: `root-class-name="srk-general-modal-root srk-react-modal-root"`.

Keep existing wrapper hooks:

- user modal outer `data-id="rankland-ranklist-user-modal"`;
- solution modal outer `data-id="rankland-ranklist-solution-modal"`;
- `wrap-class-name="rankland-user-modal"` for the user modal.

## Scope

In scope:

- Shared `src/client/components/rankland-ranklist.vue` modal props.
- `/ranklist/:id` full-chain coverage for both modal root class lists.
- Migration docs and slice plan.

Out of scope:

- Modal animation timing, focus behavior, scroll lock, or mask behavior.
- User modal body content classes already covered by previous slices.
- Low-level table cell pixel styling.

## Test Strategy

Extend the main Ranklist full-chain scenario:

1. Open Team Alpha's user modal and assert `.srk-modal-root` inside `[data-id="rankland-ranklist-user-modal"]` carries `srk-react-modal-root`, `srk-animated-modal-root`, and `srk-general-modal-root`.
2. Open a solution modal and assert `.srk-modal-root` inside `[data-id="rankland-ranklist-solution-modal"]` carries the same three classes.

RED should fail because the current Vue modal roots do not carry `srk-react-modal-root`. GREEN should pass after passing the class through `root-class-name`.

## Acceptance Criteria

- Focused Ranklist full-chain RED fails on missing `srk-react-modal-root`.
- Focused Ranklist full-chain GREEN passes after implementation.
- Full migration gate passes: `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check`.
- Migration docs record SRK modal root class parity as verified.
