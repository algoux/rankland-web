# Playground Page Foundation Design

## Goal

Migrate the public `/playground` page from `rankland-fe` into `rankland-web` as a CSR Vue route for editing SRK JSON, parsing it on demand, previewing the ranklist with the existing Vue SRK renderer, and showing stable invalid-input and render-error states.

## Source Behavior

Source files:

- `rankland-fe/src/pages/playground/index.tsx`
- `rankland-fe/src/components/SrkPlayground.tsx`
- `rankland-fe/src/components/SrkPlayground.less`
- `rankland-fe/src/assets/srk-playground-demo.srk.json.txt`

The React route:

- sets title and `og:title` to `Playground - RankLand`;
- dynamically imports `SrkPlayground` on the browser only;
- renders a loading shell during SSR or dynamic loading;
- initializes the editor with `srk-playground-demo.srk.json.txt`;
- parses JSON from editor state;
- only shows preview after the editor is ready;
- displays an invalid JSON prompt when parsing fails;
- renders valid data through `StyledRanklist`;
- exposes a link to SRK docs at `https://srk.algoux.org/zh/`;
- shows a one-time welcome modal using local storage key `PlaygroundWelcomeMessageRead`;
- uses Monaco, JSON schema diagnostics, and theme-aware editor color.

## Slice Scope

This foundation slice preserves the public route and the core workflow, not the full Monaco editor experience.

Included:

- `/playground` Vue route generated from `src/client/modules/playground/playground.view.vue`;
- CSR route contract with `ranklandRoutes.playground.ssr === false`;
- example SRK JSON source stored under the playground module;
- textarea-based SRK input for the first Vue slice;
- explicit preview action equivalent to the source prompt's `Ctrl/Cmd + S`;
- JSON parse helper with deterministic error state;
- preview rendering through the existing `RanklandRanklist` wrapper;
- render-error display when the SRK renderer cannot convert the parsed object;
- stable `data-id` selectors for unit and full-chain E2E;
- full-chain coverage confirming no RankLand upstream API calls are needed for `/playground`.

Deferred:

- Monaco integration and JSON schema diagnostics;
- one-time welcome modal;
- theme-aware Monaco editor theme;
- full visual parity with the React/Ant Design playground;
- downloadable/export actions beyond the existing renderer wrapper behavior.

## Target Route Decision

`/playground` remains a CSR route.

Rationale:

- `docs/migration/inventory.md` marks `/playground` as CSR;
- `AGENTS.md` names playground as a browser-only workflow;
- the source page explicitly gates `SrkPlayground` behind `isBrowser()` and dynamic import;
- Monaco and local editor state are browser-owned concerns;
- the page does not need RankLand API data for initial render or SEO.

The generated router files must come from `corepack pnpm run gen:client-router`. They must not be hand-edited.

## Data Flow

The Vue page will:

1. initialize `source` from the bundled demo SRK JSON string;
2. mark the page hydrated in `mounted()`;
3. keep `draftSource` in sync with the textarea;
4. call a pure parser when the user clicks Preview or presses `Ctrl/Cmd + S`;
5. store the latest parse state as either parsed ranklist data or an error message;
6. render `RanklandRanklist` for parsed data;
7. render invalid JSON or renderer conversion errors as visible page states.

The page must not call `RanklandApiService` or any upstream RankLand API endpoint.

## Components And Helpers

Create `src/client/modules/playground/playground-srk.ts`:

- `parsePlaygroundSrkSource(source)` returns `{ kind: 'valid', data }` for parsed non-null JSON objects;
- returns `{ kind: 'invalid', message }` for malformed JSON, arrays, `null`, and primitive JSON values;
- normalizes unknown thrown values into strings.

Create `src/client/modules/playground/assets/demo-ranklist.srk.json`:

- copy representative SRK demo JSON from the old playground asset;
- keep it module-local so the client bundle does not depend on test fixtures.

Create `src/client/modules/playground/playground.view.vue`:

- CSR route registered as `/playground`;
- title and `og:title` set to `Playground - RankLand`;
- textarea editor, preview button, SRK docs link, hydrated marker, and parse state display;
- `keydown` handler for `Ctrl/Cmd + S`;
- preview area backed by `RanklandRanklist`.

Update `src/client/components/rankland-ranklist.vue` through a small helper-backed render state:

- successful SRK data renders the current static ranklist table;
- conversion failure renders an error panel instead of throwing through the global Vue error handler.

## UI Contract

Stable selectors:

```text
data-id="playground-page"
data-id="playground-hydrated"
data-id="playground-editor"
data-id="playground-preview-action"
data-id="playground-docs-link"
data-id="playground-invalid-json"
data-id="playground-preview"
data-id="playground-row-count"
data-id="rankland-ranklist-render-error"
```

Stable behavior:

- `[data-id="playground-hydrated"]` is `hydrated` after mount;
- `[data-id="playground-editor"]` contains the demo SRK JSON initially;
- clicking `[data-id="playground-preview-action"]` parses current textarea contents;
- pressing `Ctrl+S` or `Meta+S` inside the editor prevents default browser save and parses current textarea contents;
- invalid JSON shows `[data-id="playground-invalid-json"]`;
- valid demo JSON shows `[data-id="playground-preview"]` and `[data-id="playground-row-count"]`;
- docs link has `href="https://srk.algoux.org/zh/"`.

## Error And Empty States

Invalid JSON:

- render `Input valid srk JSON and press Ctrl/Cmd + S to preview`;
- include the parser error message for debugging;
- keep the editor and preview action usable.

Valid JSON that cannot be converted by the renderer:

- render `[data-id="rankland-ranklist-render-error"]`;
- preserve the parsed object so the user can continue editing from the same source;
- do not crash route navigation or hydration.

Empty textarea:

- treat as invalid JSON and show the same invalid-input state.

## SEO And Head

Because `/playground` is CSR, SSR HTML is expected to be a route shell. The page still sets browser head metadata:

- title: `Playground - RankLand`;
- `og:title`: `Playground - RankLand`;
- canonical link: `/playground`.

No JSON-LD or server API preloading is required.

## Test Strategy

Unit tests:

- route contract keeps `/playground` path, build output, and CSR flag;
- generated client routes include public `Playground` but not the E2E probe route;
- `parsePlaygroundSrkSource` accepts object JSON;
- parser rejects malformed JSON, arrays, `null`, and primitive JSON;
- ranklist render state returns an error instead of throwing for invalid renderer input.

Full-chain E2E:

- `/playground` renders the CSR page, hydrates, shows title and docs link;
- demo SRK preview renders rows through the Vue renderer;
- entering invalid JSON and pressing Preview shows invalid JSON state;
- entering renderer-invalid object JSON shows the renderer error state;
- request log remains empty for RankLand upstream API endpoints.

## Acceptance Criteria

- `/playground` appears in generated client/common router maps as a public CSR route.
- `/playground` route has no RPO and does not use SSR `asyncData`.
- Demo SRK JSON previews through `RanklandRanklist`.
- Invalid JSON and renderer conversion errors are visible page states.
- Full-chain E2E confirms the route does not call RankLand upstream APIs.
- `corepack pnpm test:migration` passes with no skipped gates.

## Known Risks

- Textarea is intentionally less capable than Monaco. This keeps the first slice dependency-light and testable; Monaco/schema parity remains a later focused slice.
- The shared SRK renderer wrapper currently performs minimal presentation. This slice only adds render-failure containment, not full old `StyledRanklistRenderer` parity.
- The bundled demo JSON increases client bundle size slightly, but it matches the source route behavior and avoids a runtime fetch.
