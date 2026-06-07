# App Shell Analytics Parity Plan

## Scope

Restore App shell GA initialization and route pageview dispatch parity with the old React layout.

## File Set

- `src/client/app-analytics.ts`
- `src/client/App.vue`
- `vite.config.js`
- `tests/unit/app-analytics.spec.ts`
- `tests/unit/vite-config.spec.ts`
- `tests/e2e/full-chain/app-shell.spec.ts`
- `docs/migration/status.md`
- `docs/superpowers/specs/2026-05-26-app-shell-analytics-parity-design.md`
- `docs/superpowers/plans/2026-05-26-app-shell-analytics-parity.md`

## Steps

1. Add failing unit tests for analytics tag selection and page URL construction.
2. Extend Vite config unit coverage for `RANKLAND_GTAG` / `GTAG` exposure.
3. Add failing full-chain app-shell coverage for initial analytics initialize/pageview and CSR navigation pageview.
4. Implement `src/client/app-analytics.ts`.
5. Wire analytics initialization and delayed pageview dispatch into `App.vue`.
6. Expose analytics env values in `vite.config.js`.
7. Run focused unit and app-shell full-chain gates.
8. Run `corepack pnpm run gen:client-router`, `corepack pnpm test:migration`, and `git diff --check`.
9. Update `docs/migration/status.md` and commit the slice.

## Verification

Expected commands:

```bash
corepack pnpm test:unit -- tests/unit/app-analytics.spec.ts tests/unit/vite-config.spec.ts
corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/app-shell.spec.ts
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

## Non-Goals

- Do not migrate broader user interaction analytics.
- Do not alter visible app shell layout.
- Do not hand-edit generated router outputs.
