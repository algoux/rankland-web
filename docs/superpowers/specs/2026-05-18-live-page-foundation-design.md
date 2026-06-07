# Live Page Foundation Design

## Goal

Migrate the public `/live/:id` page foundation from `rankland-fe` into `rankland-web` as a CSR Vue route that loads live contest config, fetches and polls the live SRK ranklist, preserves public query contracts, renders through the existing Vue SRK wrapper, and keeps the scroll-solution WebSocket behind an explicit browser-only boundary.

## Source Behavior

The old React page at `rankland-fe/src/pages/live/[id].tsx`:

- reads `id` from the route as the live contest unique key;
- fetches live contest info from `getLiveRanklistInfo({ uniqueKey })`;
- derives the internal live ranklist id from `info.id`;
- fetches `getLiveRanklist({ id, token })` after info loads;
- polls the live ranklist on `LIVE_POLLING_INTERVAL`;
- preserves optional `token`, `focus`, and `scrollSolution=1` query values;
- renders `StyledRanklist` with live mode, filter, progress, and footer enabled;
- connects `WebSocket` to `WS_BASE/ranking/record/:id` only when `scrollSolution=1`;
- parses binary scroll-solution events and pushes matched member events to `ScrollSolution`;
- shows Not Found for logic NotFound errors and a generic refresh state for other load errors.

## Scope

This foundation slice includes:

- `src/client/modules/live/live.view.vue` as a CSR route for `/live/:id`;
- `src/common/modules/live/live.rpo.ts` for the route param;
- route generation updates, with generated route files regenerated rather than hand-edited;
- live API NotFound mapping for `code=11` and HTTP 404 on live info/ranklist requests;
- browser-only polling and WebSocket setup guarded behind `mounted`;
- `RANKLAND_LIVE_POLLING_INTERVAL` and `RANKLAND_WS_BASE` client env injection;
- a minimal Vue scroll-solution panel that records visible realtime events for the foundation;
- focused unit tests for live error classification and realtime buffer parsing;
- full-chain E2E coverage for `/live/:id`, including API request assertions and no external upstream calls.

## Non-Goals

This slice intentionally defers:

- full old `ScrollSolution` toast styling, queue timing, and animation parity;
- complete `StyledRanklist` controls beyond the current reusable Vue `RanklandRanklist` wrapper;
- real WebSocket backend E2E. The test boundary stubs browser `WebSocket`;
- protobuf/socket.io producer-consumer live contest server behavior;
- redesign of live page layout.

## Data Flow

The Vue page is CSR-only. It does not implement `asyncData` and should not call the RankLand upstream API during SSR.

On `mounted`:

1. mark the page hydrated;
2. read `id` from the route prop and query values from `this.$route.query`;
3. call `ranklandApiService.getLiveRanklistInfo({ uniqueKey: id })`;
4. call `ranklandApiService.getLiveRanklist({ id: info.id, token })`;
5. render `RanklandRanklist` when a ranklist is available;
6. start a polling interval using `RANKLAND_LIVE_POLLING_INTERVAL`, falling back to 10000 ms when unset or invalid;
7. when `scrollSolution=1`, open `WebSocket` at `${RANKLAND_WS_BASE}/ranking/record/${info.id}${token ? '?token=' + encodeURIComponent(token) : ''}`;
8. parse ArrayBuffer messages with the migrated realtime solution parser;
9. match the parsed `userId` to `info.members`;
10. append matched solution rows to the panel.

On route id or relevant query change, stop the existing interval/socket, clear ranklist state, and load the new live contest.

## Query Behavior

The route builder already preserves:

- `token`;
- `scrollSolution`;
- `focus`.

The page should:

- pass `token` to `getLiveRanklist`;
- connect WebSocket with the same token when scroll solution is enabled;
- keep `focus` in canonical route/query behavior even though the current renderer wrapper does not consume it yet;
- expose a switch/button that adds or removes `scrollSolution=1` while preserving other query values.

## Error Handling

`RanklandApiService.getLiveRanklistInfo` and `getLiveRanklist` should map `RanklandApiException(11)` and `RanklandHttpException(404)` to `RanklandLogicException(NotFound)`, matching the migration API contract.

The live page should classify errors into:

- `not-found`: render title `Not Found - RankLand`, `data-id="live-not-found"`, and a home link;
- `generic`: render title `Live - RankLand`, `data-id="live-error"`, and a refresh button.

WebSocket failures should not replace the ranklist. They should show a small `data-id="live-scroll-solution-status"` status while keeping the ranklist visible.

## Test Strategy

Unit tests:

- live error classification maps `RanklandLogicException(NotFound)` to `not-found`;
- live error classification maps other errors to `generic`;
- realtime solution buffer parsing returns id, problem alias, user id, result, and solved count;
- Vite config injects `RANKLAND_LIVE_POLLING_INTERVAL` and `RANKLAND_WS_BASE`;
- generated client routes include `Live` as a CSR route with `LiveRPO`.

Full-chain E2E:

- `/live/live-test-key?token=t0&scrollSolution=1&focus=yes` renders CSR shell and hydrates;
- it requests `/ranking/config/live-test-key`;
- it requests `/ranking/live-rid-1` with `token=t0`;
- it renders fixture rows through `RanklandRanklist`;
- it does not call CDN ranklist/file endpoints;
- browser WebSocket is stubbed and records the expected `/ranking/record/live-rid-1?token=t0` URL.

## Acceptance Criteria

- `/live/:id` is present in generated client route files and remains CSR.
- Live ranklist data renders from the mock backend through `RanklandApiService`.
- `token`, `scrollSolution`, and `focus` query values are preserved by route helpers.
- WebSocket setup is browser-only and optional.
- Full-chain E2E covers `/live/:id` without external network calls.
- `docs/migration/playbook.md` backlog is updated after the route reaches full-chain coverage.
