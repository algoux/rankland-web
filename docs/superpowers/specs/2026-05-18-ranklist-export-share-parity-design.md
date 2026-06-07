# Ranklist Export Share Parity Design

## Goal

Port the browser export/share actions from the old React `StyledRanklistRenderer` header into the shared Vue `RanklandRanklist` wrapper for `/ranklist/:id` and `/live/:id`.

## Source Behavior

The old React wrapper renders header actions next to the contest metadata:

- export as standard ranklist JSON (`<name>.srk.json`);
- export as Codeforces Gym Ghost dat;
- export as Virtual Judge Replay xlsx;
- export as general Excel xlsx;
- copy the current page link, excluding focus-only query state;
- copy an iframe embed snippet with `focus=yes`.

The old `/ranklist/:id` page uses `StyledRanklist` with footer, filter, and default progress/header behavior. The old `/live/:id` page uses `StyledRanklist` with live progress, filters, footer, and scroll-solution extra actions.

## Scope

This slice includes the behavior that can be migrated without adding the old React export dependency chain:

- add a small browser-action helper for SRK JSON file metadata, current-page share URL normalization, and iframe embed code generation;
- render export/share action menus in the shared Vue wrapper header when `showHeader` is enabled;
- implement standard SRK JSON download in the browser with `Blob` and temporary anchor click;
- implement copy current page link and copy embed code with `navigator.clipboard.writeText`;
- update `/ranklist/:id` to use the shared wrapper header/progress/filter/footer shape instead of a standalone page title;
- keep `/live/:id` using the same shared header actions;
- cover the helper with unit tests and both route entry points with full-chain E2E.

## Non-Goals

This slice does not migrate Codeforces Gym Ghost, Virtual Judge Replay, or general Excel export. Those need a separate dependency/API decision because the current `rankland-web` package does not include the old converter dependencies. This slice also does not migrate rank-time charts, SRK asset URL rewriting, exact Ant Design dropdown styling, or global focus layout/nav hiding.

## Data Flow

`RanklandRanklist` receives:

- `ranklist` for the SRK export body;
- `name` for the SRK filename;
- `id` and `isLive` to decide whether embed code targets `/ranklist/:id` or `/live/:id`;
- the browser location at click time for the copied current-page link.

Pure helper functions generate deterministic strings. The Vue component owns the browser-only side effects:

1. create a JSON `Blob`;
2. click a temporary hidden anchor with a download filename;
3. revoke the object URL;
4. write share/embed text to the clipboard;
5. expose short success/error status text for testability and user feedback.

## SSR/CSR Behavior

The helper is cross-runtime safe. The Vue side effects only run in click handlers after hydration. SSR output may include buttons, but it must not read `window`, `document`, `Blob`, `URL`, or `navigator` until a browser event fires.

## Test Strategy

Unit tests:

- SRK export filename/content is deterministic;
- current-page share URLs remove `focus` and `聚焦` query keys while preserving other query keys;
- ranklist and live embed snippets use the correct route and `focus=yes`.

Full-chain E2E:

- `/ranklist/test-key` renders the shared wrapper header/progress/filter/footer and action menus;
- downloading SRK JSON from `/ranklist/test-key` produces `test-key.srk.json` with the fixture contest title;
- copying page link on `/ranklist/test-key?focus=yes` writes a URL without `focus=yes`;
- copying embed code on `/ranklist/test-key` writes a ranklist iframe with `focus=yes`;
- `/live/live-test-key?token=t0&scrollSolution=1&focus=yes` renders the same action menus and copies a live iframe with `focus=yes`.

## Acceptance Criteria

- Shared Vue wrapper exposes export/share actions in the header for live and ranklist routes.
- Browser-only side effects are not executed during SSR.
- Focused unit tests pass.
- Full-chain E2E for ranklist and live pass.
- `corepack pnpm test:migration` and `git diff --check` pass before commit.
