# Live Reconnect Product Parity Plan

## Scope

Implement automatic scroll-solution WebSocket reconnect/backoff for `/live/:id` while preserving app-driven close behavior.

## File Set

- `src/client/modules/live/live-websocket-reconnect.ts`
- `src/client/modules/live/live.view.vue`
- `tests/unit/live-websocket-reconnect.spec.ts`
- `tests/e2e/full-chain/live.spec.ts`
- `docs/migration/status.md`
- `docs/superpowers/specs/2026-05-26-live-reconnect-parity-design.md`
- `docs/superpowers/plans/2026-05-26-live-reconnect-parity.md`

## Steps

1. Add failing unit tests for reconnect delay helper behavior.
2. Add failing full-chain coverage for remote close -> reconnecting -> second WebSocket connection.
3. Implement reconnect helper.
4. Wire reconnect lifecycle into `live.view.vue`, including intentional-close guards and timer cleanup.
5. Run focused unit and Live full-chain gates.
6. Run `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check`.
7. Update `docs/migration/status.md` and commit the slice.

## Verification

Expected commands:

```bash
corepack pnpm test:unit -- tests/unit/live-websocket-reconnect.spec.ts
corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/live.spec.ts
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

## Non-Goals

- Do not change generated router outputs manually.
- Do not implement Toastify animation/pixel parity.
- Do not alter RankLand API polling behavior.
