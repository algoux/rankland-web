# Collection Selected Ranklist pb-8 Class Parity Design

## Context

Old React collection route renders a selected ranklist wrapper with:

```tsx
<div
  className="pb-8"
  data-id="collection-ranklist-content"
  data-ranklist-id={rankId}
  data-row-count={String(data.ranklist.srk.rows.length)}
>
```

The migrated Vue route preserves the visual `32px` bottom spacing through `.collection-ranklist-content { padding-bottom: 32px; }`, but the old `pb-8` utility class token is missing from the loaded wrapper DOM.

## Goal

Restore old React `pb-8` class-token parity on `/collection/:id` selected ranklist content while preserving the current 32px bottom padding and existing collection layout behavior.

## Scope

- Add full-chain coverage for `[data-id="collection-ranklist-content"]` having `pb-8`.
- Keep the existing selected-ranklist data attributes and SSR/hydration behavior unchanged.
- Move the explicit 32px padding contract to a route-local `.pb-8` utility selector, matching previous route utility-class parity slices.
- Update migration status and acceptance docs after verification.

## Non-Goals

- Do not change collection navigation, collapse state, menu rendering, selected-ranklist data loading, or SRK renderer internals.
- Do not add Tailwind or a global utility system.
- Do not alter generated router files.

## Test Strategy

Use `tests/e2e/full-chain/collection.spec.ts` because the behavior is public route DOM/spacing parity and depends on the mock-backed selected ranklist route.

Focused RED:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders selected ranklist"
```

Expected failure before implementation: selected collection ranklist wrapper lacks `pb-8`.

Focused GREEN: the same command passes after restoring the class token and preserving `padding-bottom: 32px`.

Full gate:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

## Acceptance Criteria

- `[data-id="collection-ranklist-content"]` includes `pb-8`.
- The same wrapper still reports `padding-bottom: 32px`.
- Existing collection full-chain behavior remains green.
- Migration docs record the verified slice and full gate evidence.
