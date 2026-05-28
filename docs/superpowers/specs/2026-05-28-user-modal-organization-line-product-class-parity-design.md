# User Modal Organization Line Product Class Parity Design

Date: 2026-05-28
Branch: `migration/live-page-foundation`
Slice: user modal organization line product class parity

## Problem

Old React `UserInfoModal` renders the organization line as:

```tsx
<p className="mb-0">{resolveText(user.organization)}</p>
```

The migrated Vue user modal currently renders:

```vue
<p data-id="rankland-user-modal-organization" class="rankland-user-modal-line rankland-user-modal-organization mb-0">
```

The old `mb-0` token and computed zero margins are already covered, but Vue-only product classes still leak into the public DOM.

## Scope

- Remove only the Vue-only organization-line product classes:
  - `rankland-user-modal-line`
  - `rankland-user-modal-organization`
- Keep stable `data-id="rankland-user-modal-organization"` for tests and scoped styling.
- Preserve old exact `mb-0` class list and zero top/bottom margins.
- Preserve empty-organization behavior in Playground and Ranklist shared user modal paths.

## Non-Goals

- Do not change team members, markers, unofficial line, segment line, segment label, photo/slogan wrapper, slogan, or rank-time panel.
- Do not change modal title, root classes, body root, or SRK table behavior.
- Do not hand-edit generated route outputs.

## Test Strategy

Extend the existing Ranklist full-chain user modal assertions:

- `[data-id="rankland-user-modal-organization"]` has exact class list `['mb-0']`;
- it does not contain `rankland-user-modal-line` or `rankland-user-modal-organization`;
- existing text and computed margin assertions remain in place.

Then retarget organization-line CSS from `.rankland-user-modal-organization` to `[data-id='rankland-user-modal-organization'].mb-0`.

## Acceptance Criteria

- Focused Ranklist full-chain test fails before implementation because current Vue still emits Vue-only organization-line classes.
- Focused Ranklist full-chain test passes after implementation.
- Full Ranklist full-chain file passes.
- Full migration gate passes before commit.
- `git diff --check` passes.
- Migration status, manual checklist, final integration review, and this slice plan record the evidence.

## Risks

The organization line also renders for users with an empty organization. The stable `data-id` selector must preserve the zero-margin styling without relying on Vue-only class hooks.
