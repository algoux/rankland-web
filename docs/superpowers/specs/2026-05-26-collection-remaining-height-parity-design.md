# Collection Remaining Height Parity Design

## Context

The Collection product parity slice restored Ant Design Vue menu, category icons, and mobile collapse behavior, but left exact remaining-height and pixel animation parity as product polish. The old React page uses `useRemainingHeight()` from `rankland-fe/src/hooks/use-remaining-height.ts`, which computes:

```ts
document.body.clientHeight - (document.querySelector('.ant-layout-header')?.getBoundingClientRect().height || 0)
```

The old Collection page then applies that value directly to the fixed nav and applies `remainingHeight - 40` to the inline menu. The nav, collapse button, hidden header, and ranklist panel all follow the same `width 0.3s cubic-bezier(0.2, 0, 0, 1)` / `margin-left 0.3s cubic-bezier(0.2, 0, 0, 1)` animation model.

## Goal

Match the old Collection page's remaining-height calculation and nav-width-driven layout behavior in the Vue route with deterministic unit and full-chain coverage.

## Scope

- Add a framework-neutral Collection layout helper for:
  - remaining height from body height and app header height;
  - desktop/mobile nav width;
  - menu height as `remainingHeight - 40`;
  - desktop ranklist margin-left as the live nav width;
  - mobile ranklist visibility while nav is expanded.
- Update `collection.view.vue` to:
  - track remaining height after hydration;
  - refresh on window resize and body resize;
  - apply inline nav height, menu height, collapse-button width, hidden-header width, and ranklist-panel margin/display styles;
  - preserve existing Ant Design Vue menu, category icon, selected state, localStorage, and mobile collapse behavior.
- Keep SSR output stable by using deterministic fallback layout values until hydration.
- Preserve the current public route, API contract, and SRK renderer behavior.

## Non-Goals

- Do not change collection data loading, invalid `rankId` cleanup, or route generation.
- Do not change ranklist table rendering or SRK renderer internals.
- Do not introduce additional animation libraries.
- Do not make mobile header height differ from the old `useRemainingHeight` calculation; the source of truth remains `.ant-layout-header` height.

## Tests

- Add unit tests for the new layout helper covering desktop, collapsed desktop, expanded mobile, collapsed mobile, zero/negative height clamping, and missing-header fallback.
- Extend `tests/e2e/full-chain/collection.spec.ts` to assert:
  - nav inline height equals body client height minus app header height;
  - menu inline height equals remaining height minus 40;
  - collapse button inline width and transition match the old style;
  - desktop ranklist panel margin-left follows expanded and collapsed nav width;
  - mobile expanded nav hides the ranklist panel while preserving zero margin-left.

## Acceptance

- The new helper unit test fails before implementation and passes after implementation.
- The focused Collection full-chain spec fails before implementation and passes after implementation.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before the slice is reported as verified.
- `docs/migration/status.md` and the manual acceptance checklist record the remaining-height/pixel animation parity result.
