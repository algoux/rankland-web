# App Shell Focus Parity Design

## Context

The old React app wraps public pages in `rankland-fe/src/layouts/index.tsx`. In normal mode it renders a global layout with:

- logo linking to `/`;
- horizontal navigation for `/search`, `/collection/official`, and `/playground`;
- site switch entry from `RightMenu`;
- page content;
- Ant Design `BackTop`.

The old layout bypasses all global chrome when the query contains `focus=yes` or `聚焦=是`.

The Vue target currently renders only `<router-view>` from `src/client/App.vue`, so all migrated public routes are missing the visible app shell and focus-mode bypass contract.

## Goal

Add a Vue app shell that preserves the visible legacy layout contract for normal routes and hides that shell for focus-mode URLs.

## Scope

Implement one SSR-safe shell in `src/client/App.vue`:

- `data-id="app-shell"` wrapper in normal mode;
- header with RankLand logo linking to `/`;
- nav links for `探索`, `榜单合集`, and `演练场`;
- active nav marker based on the current route path;
- site switch link preserving the current URL path and query;
- `data-id="app-back-top"` button that scrolls to the top after the page has scrolled;
- shell bypass for `?focus=yes` and `?聚焦=是`.

## Non-Goals

This slice does not migrate:

- exact Ant Design Vue Menu/Dropdown styling;
- ReactGA initialization and pageview dispatch;
- Bowser-specific body optimization;
- full dark-theme parity;
- contact modal parity;
- exact BackTop animation or Ant Design pixel parity.

Those are separate product-polish or infrastructure slices.

## Architecture

Keep the shell directly in `App.vue` because it is the single root for all Vue routes and the behavior is cross-route. Avoid generated route files.

The shell computes:

- focus mode from `this.$route.query.focus === 'yes' || this.$route.query['聚焦'] === '是'`;
- current URL from `this.$route.fullPath`;
- site alias from `process.env.RANKLAND_SITE_ALIAS || process.env.SITE_ALIAS`;
- switch host from `process.env.RANKLAND_HOST_GLOBAL || process.env.HOST_GLOBAL || 'rl.algoux.org'` for `cnn`, otherwise `process.env.RANKLAND_HOST_CN || process.env.HOST_CN || 'rl.algoux.cn'`.

The switch entry is a normal external anchor:

- China-site label when the current alias is not `cnn`;
- global-site label when the current alias is `cnn`;
- `target="_blank"` and `rel="noreferrer"`.

## Test Strategy

Add full-chain Playwright coverage in a new shell spec:

- normal `/search?kw=Test%202024` route renders the shell and nav links;
- current `/search` nav item is marked active;
- site switch preserves the current full path in its `href`;
- `?focus=yes` hides the shell while preserving route content;
- `?聚焦=是` hides the shell while preserving route content.

Use the full-chain harness because this behavior is public route chrome and must survive SSR, hydration, and real router navigation.

## Acceptance Criteria

- Shell is visible on normal public routes.
- Shell is absent in both legacy focus query forms.
- Existing route-level full-chain tests keep passing.
- No hand edits are made to generated router outputs.
