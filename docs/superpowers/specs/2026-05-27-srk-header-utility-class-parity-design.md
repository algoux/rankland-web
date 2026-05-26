# SRK Header Utility Class Parity Design

## Context

The old React `StyledRanklistRenderer` renders the shared SRK header with legacy utility class tokens:

```tsx
<div className="flex items-center justify-center">
  <SrkAssetImage className="mb-2" ... />
</div>
<h1 className="text-center mb-1">...</h1>
<div className="text-center mt-1">
  ...
  <p className="mb-0">贡献者：...</p>
  ...
</div>
<p className="text-center mb-0">...</p>
```

The migrated Vue wrapper already preserves the computed header typography, alignment, banner sizing, metadata spacing, contributors, ref links, and time range through scoped classes. It does not expose several old utility class tokens on the header DOM.

## Decision

Restore the old header utility class tokens alongside migrated hooks:

- banner wrapper: keep `rankland-ranklist-banner-wrap`, add `flex items-center justify-center`;
- banner image: keep `rankland-ranklist-banner`, add `mb-2`;
- title `h1`: add `text-center mb-1`;
- metadata row: keep `rankland-ranklist-header-meta`, add `text-center mt-1`;
- contributors paragraph: keep `rankland-ranklist-contributors`, add `mb-0`;
- time paragraph: keep `rankland-ranklist-time`, add `text-center mb-0`.

Do not move contributors/ref-links into the metadata row in this slice. Existing computed visual parity is already covered, and this slice only restores old class tokens on the current Vue DOM.

## Scope

In scope:

- `src/client/components/rankland-ranklist.vue` header/banner/time DOM class tokens.
- Focused `/ranklist/:id` full-chain assertions for header class parity.
- Migration docs after verification.

Out of scope:

- Header layout restructuring, ref-link DOM structure, export/share behavior, banner asset URL logic, or typography changes.
- Low-level SRK table rendering.
- Adding global utility CSS.

## Test Strategy

Extend the main ranklist full-chain route test because the fixture includes a banner, title, metadata, contributors, ref links, and time range. Assert:

- banner wrapper includes `flex items-center justify-center`;
- banner image includes `mb-2`;
- title includes `text-center mb-1`;
- metadata row includes `text-center mt-1`;
- contributors paragraph includes `mb-0`;
- time paragraph includes `text-center mb-0`;
- existing computed typography, metadata spacing, and link behavior remain unchanged.

The focused RED should fail before implementation because the current Vue header lacks those old class tokens.

## Acceptance Criteria

- Focused ranklist full-chain test fails before implementation for missing header utility class tokens.
- Focused ranklist full-chain test passes after implementation.
- Existing header typography, metadata spacing, banner visibility, contributors, ref links, and time range behavior stay green.
- Full migration gate passes: `gen:client-router`, `test:migration`, and `git diff --check`.
