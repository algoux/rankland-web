# Playground Editor Parity Design

## Goal

Restore the old React Playground editor experience in the Vue migration by replacing the textarea editor with a client-only Monaco JSON editor, SRK schema diagnostics, theme-aware editor theme, and remaining-height layout behavior.

## Source Behavior

Source references:

- `rankland-fe/src/components/SrkPlayground.tsx`
- `rankland-fe/src/components/SrkPlayground.less`
- `rankland-fe/src/hooks/use-remaining-height.ts`
- `rankland-fe/package.json`

The old React playground:

- uses `monaco-editor@0.34.0` through `react-monaco-editor`;
- loads the editor only in the browser because Monaco cannot participate in SSR;
- creates a JSON editor with fixed width `500` and height equal to the available viewport height below the Ant Design header;
- focuses the editor after mount;
- configures Monaco JSON diagnostics with `allowComments: false`, `validate: true`, and `@algoux/standard-ranklist/schema.json`;
- switches Monaco theme between `vs-light` and `vs-dark`;
- throttles editor changes before updating preview source;
- renders the preview only after the editor is ready.

## Dependency Decision

Use:

- `@guolao/vue-monaco-editor@1.6.0`
- `monaco-editor@0.43.0`
- a local Koa static mount for `/monaco-editor/vs` from `node_modules/monaco-editor/min/`

Rationale:

- the first implementation attempted old-app version parity with `monaco-editor@0.34.0` and `vite-plugin-monaco-editor@1.1.0`;
- Vite 2 full-chain dev serving repeatedly hung on Monaco ESM dynamic/static import paths before the route could hydrate reliably;
- `@guolao/vue-monaco-editor` keeps Monaco client-only and delegates AMD loader setup, which restored reliable route hydration in full-chain E2E;
- the wrapper requires Monaco `>=0.43.0`, so exact package-version parity is intentionally traded for a verified product-compatible editor;
- serving `/monaco-editor/vs` locally keeps full-chain tests compatible with external-call denial and avoids CDN dependency in production.

## Target Behavior

The Vue `/playground` page will:

- keep `/playground` as a CSR route;
- render a loading editor container until Monaco is imported and created on the client;
- create a Monaco editor in `[data-id="playground-editor"]`;
- expose `[data-id="playground-editor-ready"]` as `ready` after editor creation;
- keep `draftSource` synchronized from Monaco changes with a throttled callback;
- preview current editor contents when the user clicks Preview or presses `Ctrl/Cmd + S` inside Monaco;
- configure Monaco JSON diagnostics with the SRK schema;
- update Monaco theme when the global `html.light` / `html.dark` class changes;
- use a remaining-height calculation equivalent to the old `useRemainingHeight` hook so the editor and preview fill the page below the app header.

## Data Flow

1. `defaultSource` is built from bundled demo SRK JSON.
2. On mount, the page computes remaining height and lets `VueMonacoEditor` load Monaco on the client through the local `/monaco-editor/vs` loader path.
3. Before editor mount, it configures JSON diagnostics with language `json`, theme from the global HTML theme, select-on-line-numbers enabled, and the current source.
4. The editor change handler throttles source synchronization; Preview and the Monaco `Ctrl/Cmd + S` command parse the current editor contents.
5. `Ctrl/Cmd + S` is handled by a Monaco command while focus is inside the editor.
6. A `MutationObserver`, `ResizeObserver`, and window resize listener keep theme and height in sync.
7. On unmount, the wrapper disposes Monaco internals and the page cleans observers, listeners, and E2E-only hooks.

## Test Strategy

Unit tests:

- Monaco diagnostics helper returns SRK schema options with `validate: true`, `allowComments: false`, `fileMatch: ['*']`, and a schema URI containing the installed `@algoux/standard-ranklist` version.
- Theme helper maps dark/light input to `vs-dark` / `vs-light`.

Full-chain E2E:

- `/playground` renders a visible Monaco editor and marks the editor ready.
- Monaco shows JSON editing DOM instead of the previous textarea-only editor.
- An E2E-only preview hook verifies invalid/render-error states without upstream API calls; direct synthetic Monaco editing is avoided because it hangs in the current Vite 2 full-chain harness even though the product path uses Monaco `@change`, Preview, and `Ctrl/Cmd + S`.
- In dark system theme, the page reports `vs-dark` as the active Monaco theme.
- Existing welcome modal, bundled preview, viewport, and no-upstream-call coverage remain.

## Acceptance Criteria

- Monaco editor replaces the textarea editing surface.
- SRK schema diagnostics are configured in code and covered by unit tests.
- Theme-aware Monaco theme is covered by full-chain E2E.
- Full-chain Playground tests cover Monaco readiness, DOM replacement, dark theme, preview output, and stable invalid/render-error states.
- `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check` pass before commit.

## Known Risks

- Monaco adds client bundle and worker complexity. The production build and full-chain hydration are the authoritative verification.
- The editor uses Monaco `0.43.0` instead of the old React app's `0.34.0` because the verified Vue wrapper requires the newer peer dependency.
- Monaco DOM is more complex than textarea DOM. E2E tests should prefer stable page selectors and the E2E-only preview hook over private Monaco editing internals in the current harness.
