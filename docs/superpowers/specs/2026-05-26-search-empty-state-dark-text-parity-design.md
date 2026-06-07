# Search Empty State Dark Text Parity Design

## Context

The old React search page renders the recent empty state as a plain `div` with `mt-2`:

```tsx
<div className="mt-2">暂无最近更新的榜单</div>
```

It inherits Ant Design/global body text color. In dark mode that should follow the restored legacy body token, `rgba(255, 255, 255, 0.85)`.

The Vue search page keeps the legacy `mt-2` spacing through `.search-empty-state { margin-top: 8px; }`, but it also hard-codes `color: #64748b`. That makes the empty state visually muted in dark mode and diverges from the old React behavior.

## Goal

Restore old Ant Design/global body text color parity for the search recent empty state in dark mode while preserving the already verified `mt-2` spacing and CSR loading behavior.

## Scope

- Add a forced dark-mode full-chain E2E assertion for the recent empty-state text color when `/rank/listall` returns an empty rank list.
- Update `src/client/modules/search/search.view.vue` so `.search-empty-state` inherits the legacy body text color instead of using a custom muted color.
- Update migration docs after verification.

## Non-Goals

- Do not change search input behavior, Fuse search behavior, URL query normalization, loading state, or API mocks.
- Do not change list row metadata opacity; that is already covered separately as old `opacity-70` / `opacity-50` parity.
- Do not redesign search page spacing or layout.

## Design

Use `color: var(--rankland-legacy-text-color)` for `.search-empty-state`, matching the global light/dark text token already restored in `src/client/index.less`. Keep the `margin-top: 8px` rule unchanged.

The test should be placed in the existing recent-empty-state full-chain case because it already controls the backend response to `{ ranks: [] }`, making the state deterministic.

## Test Strategy

Follow TDD:

1. Add a `forceSystemDarkMode` helper to `tests/e2e/full-chain/search.spec.ts`.
2. Use it in the recent empty-state test before `page.goto('/search')`.
3. Assert `.search-empty-state` computes to `rgba(255, 255, 255, 0.85)`.
4. Run the focused test and confirm RED fails with the current `rgb(100, 116, 139)`.
5. Apply the minimal CSS change and rerun focused search, then the full search spec, then the migration gate.

## Acceptance Criteria

- In forced dark mode, the search recent empty state computes to `rgba(255, 255, 255, 0.85)`.
- The existing `margin-top: 8px` assertion continues to pass.
- Search full-chain tests continue to pass.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.

## Risks

- The dark-mode helper changes the system theme before page load. Use it only in the recent-empty-state test so existing search coverage for normal rows and screenshots remains unchanged.
