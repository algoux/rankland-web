# App Shell Product Parity Design

## Context

The migration dashboard still lists exact Ant Design shell styling and SSR/hydration flicker as deferred product polish. The old React shell in `rankland-fe/src/layouts/index.tsx`, `NavMenu.tsx`, and `RightMenu.tsx` used Ant Design `Layout`, `Menu`, `Dropdown`, `Button`, and `BackTop`. The current Vue shell in `src/client/App.vue` preserves route behavior but implements the shell with custom markup.

## Goal

Restore the public app shell to an Ant Design Vue based implementation and add a pre-hydration theme bootstrap so dark/light shell styling is selected before the Vue client mounts.

## Scope

- Use `ant-design-vue` components for the global shell layout, navigation menu, site switch dropdown, text button, and back-to-top control.
- Preserve existing route compatibility, focus-mode bypass, site-switch target URL, system theme sync, and macOS Blink optimization behavior.
- Add a static HTML theme bootstrap in `index.html` so SSR/CSR startup sets `html.light` or `html.dark` before app content is painted.
- Mount Ant Design Vue `a-menu` through `ClientOnly`; its ResizeObserver/overflow wrapper produces SSR/client hydration node mismatches when rendered server-side.
- Keep the slice focused on the app shell. Collection, Playground, Live, and remaining SRK renderer product parity stay in the queue.

## Tests

- Extend `tests/e2e/full-chain/app-shell.spec.ts` with Ant Design shell DOM assertions:
  - app shell has `.ant-layout`;
  - header has `.ant-layout-header`;
  - nav uses `.ant-menu-horizontal`;
  - active item is represented by `.ant-menu-item-selected`;
  - site switch trigger is an Ant Design button/dropdown trigger;
  - BackTop uses Ant Design Vue classes after scrolling.
- Extend the same full-chain spec with a raw SSR HTML assertion that verifies the theme bootstrap script is present before the client entry script.

## Acceptance

- Focused app-shell full-chain spec passes.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before claiming the broader gate for this slice.
- `docs/migration/status.md` records this product-polish slice and leaves non-app-shell deferred product work explicit.
